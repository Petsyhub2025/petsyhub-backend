import { ModelNames, RabbitExchanges, RabbitRoutingKeys } from '@common/constants';
import {
  BasePaginationQuery,
  IAreaModel,
  ICityModel,
  ICountryModel,
  IPetTypeModel,
  ISearchResponseData,
  IUserModel,
  IUserPushNotificationModel,
  IUserSegmentModel,
  ResponsePayload,
  RpcResponse,
  UserPushNotificationStatusEnum,
  UserSegment,
  UserSegmentHelperService,
  UserSegmentLocationSubSchemaType,
  UserSegmentsAdminRpcPayload,
  addMaintainOrderStages,
  addPaginationStages,
} from '@instapets-backend/common';
import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UserSegmentIdParamDto, errorManager } from '@notifications/admin/shared';
import { PipelineStage, Types } from 'mongoose';
import { concatMap, from, lastValueFrom } from 'rxjs';
import { getUserSegmentAggregationPipeline } from './aggregations/get-user-segment.aggregation';
import { CalculateUserCountDto } from './dto/calculate-user-count.dto';
import { CreateUserSegmentDto, UserSegmentDeviceDto, VersionRangeDto } from './dto/create-user-segment.dto';
import { GetUserSegmentsQueryDto } from './dto/get-user-segments.dto';
import { UpdateUserSegmentDto } from './dto/update-user-segment.dto';
import { CalculateUserCountByUserSegmentsQueryDto } from './dto/calculate-user-count-by-user-segments.dto';
import { getUserSegmentsAggregationPipeLine } from './aggregations/get-user-segments.aggregation';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class UserSegmentsService {
  constructor(
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.USER_SEGMENT) private userSegmentModel: IUserSegmentModel,
    @Inject(ModelNames.USER_PUSH_NOTIFICATION) private userPushNotificationModel: IUserPushNotificationModel,
    @Inject(ModelNames.COUNTRY) private countryModel: ICountryModel,
    @Inject(ModelNames.CITY) private cityModel: ICityModel,
    @Inject(ModelNames.AREA) private areaModel: IAreaModel,
    @Inject(ModelNames.PET_TYPE) private petTypeModel: IPetTypeModel,
    private readonly userSegmentHelperService: UserSegmentHelperService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async getUserSegments(adminId: string, query: GetUserSegmentsQueryDto): Promise<ResponsePayload<UserSegment>> {
    const { limit, page, search, isArchived } = query;

    if (search) {
      return this.getSearchedUserSegments(query);
    }

    const matchStage: PipelineStage[] = [
      {
        $match: {
          ...(isArchived != undefined && { isArchived }),
        },
      },
    ];

    const [userSegments, [{ total = 0 } = {}]] = await Promise.all([
      this.userSegmentModel.aggregate([
        ...matchStage,
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ limit, page }),
        ...getUserSegmentsAggregationPipeLine(),
      ]),
      this.userSegmentModel.aggregate([...matchStage]).count('total'),
    ]);

    return {
      data: userSegments,
      total,
      limit,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  private async getSearchedUserSegments({
    page,
    limit,
    search,
    isArchived,
  }: GetUserSegmentsQueryDto): Promise<ResponsePayload<UserSegment>> {
    const payload: UserSegmentsAdminRpcPayload = {
      page,
      limit,
      search,
      isArchived,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_USER_SEGMENTS_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.userSegmentModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getUserSegmentsAggregationPipeLine(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getUserSegmentDetails(adminId: string, { userSegmentId }: UserSegmentIdParamDto) {
    const userSegment = await this.userSegmentModel.exists({ _id: userSegmentId });

    if (!userSegment) {
      throw new NotFoundException(errorManager.USER_SEGMENT_NOT_FOUND);
    }

    return this.populateUserSegment(userSegmentId);
  }

  async getNotificationsUsingUserSegment(
    adminId: string,
    { userSegmentId }: UserSegmentIdParamDto,
    { limit, page }: BasePaginationQuery,
  ) {
    const userSegment = await this.userSegmentModel.exists({ _id: userSegmentId });

    if (!userSegment) {
      throw new NotFoundException(errorManager.USER_SEGMENT_NOT_FOUND);
    }

    const [userPushNotifications, total] = await Promise.all([
      this.userPushNotificationModel
        .find(
          {
            userSegments: {
              $in: [userSegmentId],
            },
            status: UserPushNotificationStatusEnum.SENT,
          },
          {
            name: 1,
            createdAt: 1,
            usersCount: 1,
          },
        )
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.userPushNotificationModel.countDocuments({
        userSegments: {
          $in: [userSegmentId],
        },
      }),
    ]);

    return {
      data: userPushNotifications,
      total,
      limit,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async calculateUserCountByFilters(adminId: string, body: CalculateUserCountDto) {
    if (Object.keys(body).length < 1) {
      throw new UnprocessableEntityException(errorManager.USER_SEGMENT_MUST_HAVE_ATLEAST_ONE_FIELD);
    }

    const { locations, petTypes, devices } = body;

    if (locations) {
      await this.assertLocationsExist(locations);
    }

    if (petTypes) {
      await this.assertPetTypesExist(petTypes);
    }

    const partialUserSegment: Omit<UserSegment, 'title' | 'description'> = {
      ...body,
      ...(devices && {
        devices: this.processUserSegmentDeviceVersions(devices),
      }),
    };

    const filters = this.userSegmentHelperService.getUserSegmentQueryFilters(partialUserSegment);

    const [{ totalUsers = 0 } = {}] = await this.userModel
      .aggregate([
        {
          $match: {
            ...filters,
          },
        },
      ])
      .count('totalUsers');

    return { totalUsersInSegment: totalUsers };
  }

  async calculateUserCountByUserSegments(
    adminId: string,
    { userSegmentIds }: CalculateUserCountByUserSegmentsQueryDto,
  ) {
    const userSegments = await this.userSegmentModel.find({ _id: { $in: userSegmentIds } }).lean();

    if (userSegments.length !== userSegmentIds.length) {
      throw new NotFoundException(errorManager.USER_SEGMENT_NOT_FOUND);
    }

    const allSegmentFilters = userSegments.map((userSegment) =>
      this.userSegmentHelperService.getUserSegmentQueryFilters(userSegment),
    );

    const [{ totalUsers = 0 } = {}] = await this.userModel
      .aggregate([
        {
          $match: {
            $or: allSegmentFilters,
          },
        },
      ])
      .count('totalUsers');

    return { totalUsersInSegments: totalUsers };
  }

  async createUserSegment(adminId: string, body: CreateUserSegmentDto) {
    const { title, locations, petTypes, devices } = body;

    const userSegmentExists = await this.userSegmentModel.exists({ title });

    if (userSegmentExists) {
      throw new ConflictException(errorManager.USER_SEGMENT_ALREADY_EXISTS);
    }

    if (locations) {
      await this.assertLocationsExist(locations);
    }

    if (petTypes) {
      await this.assertPetTypesExist(petTypes);
    }

    const userSegment = new this.userSegmentModel();

    userSegment.set({
      ...body,
      ...(devices && {
        devices: this.processUserSegmentDeviceVersions(devices),
      }),
    });

    const savedUserSegment = await userSegment.save();

    return this.populateUserSegment(savedUserSegment._id);
  }

  async updateUserSegment(adminId: string, { userSegmentId }: UserSegmentIdParamDto, body: UpdateUserSegmentDto) {
    const { locations, petTypes, title, devices } = body;

    const userSegment = await this.userSegmentModel.findById(userSegmentId);

    if (!userSegment) {
      throw new NotFoundException(errorManager.USER_SEGMENT_NOT_FOUND);
    }

    const userPushNotificationUsedUserSegment = await this.userPushNotificationModel.exists({
      userSegments: {
        $in: [userSegmentId],
      },
      status: UserPushNotificationStatusEnum.SENT,
    });

    if (userPushNotificationUsedUserSegment) {
      throw new ConflictException(errorManager.CANNOT_UPDATE_USER_SEGMENT_USED_BY_SENT_USER_PUSH_NOTIFICATION);
    }

    if (title) {
      const userSegmentExists = await this.userSegmentModel.exists({ title, _id: { $ne: userSegmentId } });

      if (userSegmentExists) {
        throw new ConflictException(errorManager.USER_SEGMENT_ALREADY_EXISTS);
      }
    }

    if (locations) {
      await this.assertLocationsExist(locations);
    }

    if (petTypes) {
      await this.assertPetTypesExist(petTypes);
    }

    userSegment.set({
      ...body,
      ...(devices && {
        devices: this.processUserSegmentDeviceVersions(devices),
      }),
    });

    await userSegment.save();

    return this.populateUserSegment(userSegmentId);
  }

  async deleteUserSegment(adminId: string, { userSegmentId }: UserSegmentIdParamDto) {
    const userSegment = await this.userSegmentModel.findById(userSegmentId);

    if (!userSegment) {
      throw new NotFoundException(errorManager.USER_SEGMENT_NOT_FOUND);
    }

    const userPushNotificationUsingUserSegment = await this.userPushNotificationModel.exists({
      userSegments: {
        $in: [userSegmentId],
      },
      scheduledDate: { $gte: new Date() },
    });

    if (userPushNotificationUsingUserSegment) {
      throw new ConflictException(errorManager.USER_SEGMENT_IS_BEING_USED_BY_ACTIVE_USER_PUSH_NOTIFICATION);
    }

    await userSegment.deleteDoc();
  }

  async archiveUserSegment(adminId: string, { userSegmentId }: UserSegmentIdParamDto) {
    const userSegment = await this.userSegmentModel.findById(userSegmentId);

    if (!userSegment) {
      throw new NotFoundException(errorManager.USER_SEGMENT_NOT_FOUND);
    }

    const userPushNotificationUsingUserSegmentCount = await this.userPushNotificationModel.countDocuments({
      userSegments: {
        $in: [userSegmentId],
      },
      status: UserPushNotificationStatusEnum.SCHEDULED,
    });

    if (userPushNotificationUsingUserSegmentCount > 0) {
      throw new UnprocessableEntityException(
        errorManager.CANNOT_ARCHIVE_USER_SEGMENT_USED_BY_SCHEDULED_USER_PUSH_NOTIFICATION(
          userPushNotificationUsingUserSegmentCount,
        ),
      );
    }

    userSegment.set({
      isArchived: true,
    });

    await userSegment.save();
  }

  async unarchiveUserSegment(adminId: string, { userSegmentId }: UserSegmentIdParamDto) {
    const userSegment = await this.userSegmentModel.findById(userSegmentId);

    if (!userSegment) {
      throw new NotFoundException(errorManager.USER_SEGMENT_NOT_FOUND);
    }

    userSegment.set({
      isArchived: false,
    });

    await userSegment.save();
  }

  private async populateUserSegment(userSegmentId: string | Types.ObjectId) {
    const [userSegment] = await this.userSegmentModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(userSegmentId),
        },
      },
      ...getUserSegmentAggregationPipeline(),
    ]);

    return userSegment;
  }

  private async assertPetTypesExist(petTypes: Types.ObjectId[]) {
    const petTypeIdsSet = new Set(petTypes.map((petType) => petType.toString()));

    if (petTypeIdsSet.size !== petTypes.length) {
      throw new UnprocessableEntityException(errorManager.PET_TYPE_DUPLICATED);
    }

    const petTypesExist = await this.petTypeModel.find({ _id: { $in: petTypes } }, { _id: 1 }).lean();

    if (petTypesExist.length !== petTypes.length) {
      throw new NotFoundException(errorManager.PET_TYPE_NOT_FOUND);
    }
  }

  private async assertLocationsExist(locations: UserSegmentLocationSubSchemaType[]) {
    const locationsMap: Record<string, { city?: Types.ObjectId; area: Types.ObjectId }> = {};
    await lastValueFrom(
      from(locations).pipe(concatMap((location) => this._assertLocationsExist(location, locationsMap))),
    );
  }

  private async _assertLocationsExist(
    location: UserSegmentLocationSubSchemaType,
    locationsMap: Record<string, { city?: Types.ObjectId; area: Types.ObjectId }>,
  ) {
    const { country, city, area } = location;

    if (city && !country) {
      throw new UnprocessableEntityException(errorManager.COUNTRY_MUST_BE_PROVIDED);
    }

    if (area && !city) {
      throw new UnprocessableEntityException(errorManager.CITY_MUST_BE_PROVIDED);
    }

    const countryKey = country?.toString();
    const locationsMapCountry = locationsMap[countryKey];

    if (locationsMapCountry) {
      if (!city && !area) {
        throw new UnprocessableEntityException(errorManager.COUNTRY_DUPLICATED);
      }

      if (city && locationsMapCountry.city) {
        throw new UnprocessableEntityException(errorManager.CITY_DUPLICATED);
      }

      if (area && locationsMapCountry.area) {
        throw new UnprocessableEntityException(errorManager.AREA_DUPLICATED);
      }

      locationsMapCountry.city = city;
      locationsMapCountry.area = area;
    }

    if (!locationsMapCountry) {
      locationsMap[countryKey] = {
        city,
        area,
      };
    }

    const [countryExists, cityExists, areaExists] = await Promise.all([
      this.countryModel.exists({ _id: country }),
      this.cityModel.exists({ _id: city, ...(country && { country }) }),
      this.areaModel.exists({ _id: area, ...(city && { city }) }),
    ]);

    if (country && !countryExists) {
      throw new NotFoundException(errorManager.COUNTRY_NOT_FOUND);
    }

    if (city && !cityExists) {
      throw new NotFoundException(errorManager.CITY_NOT_FOUND);
    }

    if (area && !areaExists) {
      throw new NotFoundException(errorManager.AREA_NOT_FOUND);
    }
  }

  private processUserSegmentDeviceVersions(devices: UserSegmentDeviceDto) {
    return Object.entries(devices).reduce((acc, [deviceType, { min, max }]: [string, VersionRangeDto]) => {
      acc[deviceType] = {
        ...(min && { min: this.processVersion(min) }),
        ...(max && { max: this.processVersion(max) }),
      };
      return acc;
    }, {});
  }

  private processVersion(version: string) {
    const versionParts = version.split('.').map((part) => Number(part));

    const allPartsAreNumbers = versionParts.every((part) => !isNaN(part));

    if (!allPartsAreNumbers) {
      throw new UnprocessableEntityException(errorManager.WRONG_VERSION_TYPE);
    }

    return {
      major: versionParts[0],
      minor: versionParts[1],
      patch: versionParts[2],
    };
  }
}
