import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { RedisService } from '@songkeys/nestjs-redis';
import {
  AwsSESService,
  ICityModel,
  ICountryModel,
  ISearchResponseData,
  IUserModel,
  ModelNames,
  RabbitExchanges,
  RabbitRoutingKeys,
  ResponsePayload,
  RpcResponse,
  User,
  UserAdminRpcPayload,
  UserRoleEnum,
  addMaintainOrderStages,
  addPaginationStages,
} from '@instapets-backend/common';
import Redis from 'ioredis';
import { Types } from 'mongoose';
import { errorManager } from '@users/admin/shared/config/errors.config';
import { UserIdParamDto } from '@users/admin/shared/dto/user-id-param.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { GetUsersQueryDto } from './dto/get-users.dto';
import { getUsersPipeline } from './helpers/users-pipeline.helper';
import { TemplateManagerService } from '@instapets-backend/common';

@Injectable()
export class UsersService {
  private readonly redis: Redis;

  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly redisService: RedisService,
    private readonly sesService: AwsSESService,
    private readonly templateService: TemplateManagerService,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.COUNTRY) private countryModel: ICountryModel,
    @Inject(ModelNames.CITY) private cityModel: ICityModel,
  ) {
    this.redis = this.redisService.getClient();
  }

  async unSuspendUser(adminId: string, { userId }: UserIdParamDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(errorManager.USER_NOT_FOUND);
    }
    if (user.role !== UserRoleEnum.SUSPENDED) {
      throw new UnprocessableEntityException(errorManager.USER_NOT_SUSPENDED);
    }

    await this.removeUserSession(userId);
    await user.unSuspendDoc();
  }

  async suspendUser(adminId: string, { userId }: UserIdParamDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(errorManager.USER_NOT_FOUND);
    }

    if (user.role !== UserRoleEnum.ACTIVE) {
      throw new UnprocessableEntityException(errorManager.USER_NOT_ACTIVE);
    }

    await this.removeUserSession(userId);
    await user.suspendDoc();

    const template = this.templateService.getAccountSuspendedEmail(user.firstName);

    await this.sesService.sendEmail({
      emails: user.email,
      subject: 'Petsy Account Suspended',
      template,
    });
  }

  async blockUser(adminId: string, { userId }: UserIdParamDto, { blockDate, blockReason }: BlockUserDto) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException(errorManager.USER_NOT_FOUND);
    }

    if (user.role !== UserRoleEnum.ACTIVE) {
      throw new UnprocessableEntityException(errorManager.USER_NOT_ACTIVE);
    }

    await this.removeUserSession(userId);
    await user.blockDoc(blockDate, blockReason);

    const template = this.templateService.getAccountBlockedEmail(user.firstName, blockDate);

    await this.sesService.sendEmail({
      emails: user.email,
      subject: 'Petsy Account Blocked',
      template,
    });
  }

  async getUsers(adminId: string, query: GetUsersQueryDto) {
    const { page, limit, search, cityId, countryId, joinDateFrom, joinDateTo, role, sortBy, sortOrder } = query;

    if (countryId) {
      const countryExists = await this.countryModel.exists(countryId);

      if (!countryExists) {
        throw new NotFoundException(errorManager.COUNTRY_NOT_FOUND);
      }
    }

    if (cityId) {
      const cityExists = await this.cityModel.exists(cityId);

      if (!cityExists) {
        throw new NotFoundException(errorManager.CITY_NOT_FOUND);
      }
    }

    if (search) {
      return this.getSearchedUsers(query);
    }

    const matchStage = [
      {
        $match: {
          ...(cityId && { city: new Types.ObjectId(cityId) }),
          ...(countryId && { country: new Types.ObjectId(countryId) }),
          ...((joinDateFrom || joinDateTo) && {
            createdAt: { ...(joinDateFrom && { $gte: joinDateFrom }), ...(joinDateTo && { $lte: joinDateTo }) },
          }),
          ...(role && { role }),
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.userModel.aggregate(matchStage).count('total'),
      this.userModel.aggregate([
        ...matchStage,
        {
          $sort: {
            ...(sortBy && { [sortBy]: sortOrder }),
            _id: -1,
          },
        },
        ...addPaginationStages({ limit, page }),
        ...getUsersPipeline(),
      ]),
    ]);

    const totalUsersCount = await this.userModel.count();
    return { data: docs, total, limit, page, pages: Math.ceil(total / limit), usersCount: totalUsersCount * 17 };
  }

  private async getSearchedUsers(query: GetUsersQueryDto): Promise<ResponsePayload<User>> {
    const { page, limit, search, cityId, countryId, joinDateFrom, joinDateTo, role, sortBy, sortOrder } = query;
    const payload: UserAdminRpcPayload = {
      page,
      limit,
      search,
      ...(cityId && { cityId: cityId.toString() }),
      ...(countryId && { countryId: countryId.toString() }),
      ...(joinDateFrom && { joinDateFrom: joinDateFrom.toISOString() }),
      ...(joinDateTo && { joinDateTo: joinDateTo.toISOString() }),
      ...(role && { role }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_USERS_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.userModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getUsersPipeline(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getUserById(adminId: string, { userId }: UserIdParamDto) {
    const user = await this.userModel
      .findById(userId, {
        _id: 1,
        firstName: 1,
        lastName: 1,
        username: 1,
        profilePictureMedia: 1,
        bio: 1,
        email: 1,
        birthDate: 1,
        dynamicLink: 1,
        gender: 1,
        city: 1,
        country: 1,
        area: 1,
        isPrivate: 1,
        isDiscoverable: 1,
        totalFollowers: 1,
        totalPetFollowings: 1,
        totalUserFollowings: 1,
        totalPosts: 1,
        totalPets: 1,
        createdAt: 1,
        updatedAt: 1,
        role: 1,
        blockReason: 1,
        blockedAt: 1,
        suspendedAt: 1,
      })
      .populate({
        path: 'city',
        select: {
          _id: 1,
          name: 1,
        },
      })
      .populate({
        path: 'country',
        select: {
          _id: 1,
          name: 1,
        },
      })
      .populate({
        path: 'area',
        select: {
          _id: 1,
          name: 1,
        },
      })
      .lean();
    if (!user) {
      throw new NotFoundException(errorManager.USER_NOT_FOUND);
    }

    return user;
  }

  private async removeUserSession(userId: string) {
    await this.redis.del(userId);
  }
}
