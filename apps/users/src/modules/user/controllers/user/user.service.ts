import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BasePaginationQuery,
  BaseSearchPaginationQuery,
  IPendingUserFollowModel,
  ISearchResponseData,
  IUserBlockModel,
  IUserFollowModel,
  IUserModel,
  ModelNames,
  PendingUserFollowEventsEnum,
  RabbitExchanges,
  RabbitRoutingKeys,
  ResponsePayload,
  RpcResponse,
  User,
  UserBlockHelperService,
  UserFollowEventsEnum,
  UserFollowersRpcPayload,
  UserFollowingRpcPayload,
  addMaintainOrderStages,
  addPaginationStages,
  getIsUserFollowed,
} from '@instapets-backend/common';
import { errorManager } from '@users/user/shared/config/errors.config';
import { UserIdParamDto } from '@users/user/shared/dto/user-id-param.dto';
import { Types } from 'mongoose';
import { GetUserFollowersQueryDto } from './dto/get-user-followers.dto';
import { GetUserFollowingsQueryDto } from './dto/get-user-followings.dto';
import { getFollowersPipeline, getFollowingsPipeline, getUsersPipeline } from './helpers/users-pipeline.helper';

@Injectable()
export class UserService {
  constructor(
    @Inject(ModelNames.USER_FOLLOW) private userFollowModel: IUserFollowModel,
    @Inject(ModelNames.USER_BLOCK) private userBlockModel: IUserBlockModel,
    @Inject(ModelNames.PENDING_USER_FOLLOW) private pendingUserFollowModel: IPendingUserFollowModel,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    private readonly eventEmitter: EventEmitter2,
    private readonly userBlockHelperService: UserBlockHelperService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async followUser(userId: string, { userId: followUserId }: UserIdParamDto) {
    if (userId.toString() === followUserId.toString()) {
      throw new ConflictException(errorManager.CANNOT_FOLLOW_YOURSELF);
    }

    const user = await this.userModel
      .findOne(
        {
          _id: followUserId,
          isViewable: true,
        },
        { _id: 0, isPrivate: 1 },
      )
      .lean();
    if (!user) {
      throw new ConflictException(errorManager.USER_NOT_FOUND);
    }

    const [oldUserFollow, areUsersMutuallyOrPartiallyBlocked] = await Promise.all([
      this.userFollowModel.exists({ follower: userId, following: followUserId }),
      this.userBlockHelperService.areUsersMutuallyOrPartiallyBlocked(userId, followUserId),
    ]);

    if (areUsersMutuallyOrPartiallyBlocked) {
      throw new ConflictException(errorManager.USER_NOT_FOUND);
    }

    if (user.isPrivate && !oldUserFollow) {
      const pendingUserFollow = await this.pendingUserFollowModel.findOne({
        follower: userId,
        following: followUserId,
      });

      if (pendingUserFollow) {
        throw new ConflictException(errorManager.PENDING_FOLLOW_ALREADY_EXISTS);
      }

      const newPendingUserFollow = new this.pendingUserFollowModel({ follower: userId, following: followUserId });
      const savedPendingFollow = await newPendingUserFollow.save();

      this.eventEmitter.emit(PendingUserFollowEventsEnum.SEND_NOTIFICATION, savedPendingFollow);

      return;
    }

    if (oldUserFollow) {
      throw new ConflictException(errorManager.FOLLOW_ALREADY_EXISTS);
    }

    const userFollow = new this.userFollowModel({ follower: userId, following: followUserId });
    const savedFollow = await userFollow.save();

    this.eventEmitter.emit(UserFollowEventsEnum.SEND_NOTIFICATION, savedFollow);
  }

  async unFollowUser(userId: string, { userId: followUserId }: UserIdParamDto) {
    const user = await this.userModel
      .findOne(
        {
          _id: followUserId,
          isViewable: true,
        },
        { _id: 0, isPrivate: 1 },
      )
      .lean();
    if (!user) {
      throw new ConflictException(errorManager.USER_NOT_FOUND);
    }

    const [userFollow, pendingUserFollow] = await Promise.all([
      this.userFollowModel.findOne({ follower: userId, following: followUserId }),
      this.pendingUserFollowModel.findOne({ follower: userId, following: followUserId }),
    ]);

    if (!userFollow && !pendingUserFollow) {
      throw new NotFoundException(errorManager.USER_NOT_FOLLOWED);
    }
    if (userFollow) {
      await userFollow.deleteDoc();
    }
    if (pendingUserFollow) {
      await pendingUserFollow.deleteDoc();
    }
  }

  async acceptPendingFollow(userId: string, { userId: followerId }: UserIdParamDto) {
    const pendingUserFollow = await this.pendingUserFollowModel.findOne({ follower: followerId, following: userId });
    if (!pendingUserFollow) {
      throw new NotFoundException(errorManager.PENDING_REQUEST_NOT_FOUND);
    }

    const [areUsersMutuallyOrPartiallyBlocked, existingFollower] = await Promise.all([
      this.userBlockHelperService.areUsersMutuallyOrPartiallyBlocked(pendingUserFollow.follower, userId),
      this.userModel.exists({ _id: pendingUserFollow.follower, isViewable: true }),
    ]);

    if (areUsersMutuallyOrPartiallyBlocked || !existingFollower) {
      throw new ConflictException(errorManager.USER_NOT_FOUND);
    }

    if (
      await this.userFollowModel.exists({
        follower: pendingUserFollow.follower,
        following: pendingUserFollow.following,
      })
    ) {
      await pendingUserFollow.deleteDoc();

      return;
    }

    const userFollow = new this.userFollowModel({
      follower: pendingUserFollow.follower,
      following: pendingUserFollow.following,
    });

    await userFollow.save();

    await pendingUserFollow.deleteDoc();
  }

  async declinePendingFollow(userId: string, { userId: followerId }: UserIdParamDto) {
    const pendingUserFollow = await this.pendingUserFollowModel.findOne({ follower: followerId, following: userId });

    if (!pendingUserFollow) {
      throw new NotFoundException(errorManager.PENDING_REQUEST_NOT_FOUND);
    }

    await pendingUserFollow.deleteDoc();
  }

  async cancelPendingFollow(userId: string, { userId: followingId }: UserIdParamDto) {
    const pendingUserFollow = await this.pendingUserFollowModel.findOne({ follower: userId, following: followingId });

    if (!pendingUserFollow) {
      throw new NotFoundException(errorManager.PENDING_REQUEST_NOT_FOUND);
    }

    await pendingUserFollow.deleteDoc();
  }

  async getFollowers(userId: string, query: GetUserFollowersQueryDto): Promise<ResponsePayload<User>> {
    const { limit, page, userId: targetUserId, recent, search } = query;

    const [targetUser, areUsersMutuallyOrPartiallyBlocked] = await Promise.all([
      this.userModel.findOne({
        _id: targetUserId,
        isViewable: true,
      }),
      this.userBlockHelperService.areUsersMutuallyOrPartiallyBlocked(userId, targetUserId),
    ]);

    if (targetUserId && (!targetUser || targetUser?.isPrivate || areUsersMutuallyOrPartiallyBlocked)) {
      throw new NotFoundException(errorManager.USER_NOT_FOUND);
    }

    if (search) {
      return this.getSearchedFollowers(userId, query);
    }

    const matchStage = [
      {
        $match: {
          following: new Types.ObjectId(targetUserId || userId),
          ...(recent && {
            createdAt: {
              $gte: new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days
            },
          }),
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.userFollowModel.aggregate(matchStage).count('total'),
      this.userFollowModel.aggregate([
        ...matchStage,
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ page, limit }),
        ...getFollowersPipeline(userId),
      ]),
    ]);

    return {
      data: docs,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  private async getSearchedFollowers(
    userId: string,
    { page, limit, search, recent, userId: targetUserId }: GetUserFollowersQueryDto,
  ): Promise<ResponsePayload<User>> {
    const payload: UserFollowersRpcPayload = {
      page,
      limit,
      search,
      recent,
      userId,
      targetUserId,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_USER_GET_USER_FOLLOWERS_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.userFollowModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getFollowersPipeline(userId),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getFollowings(userId: string, query: GetUserFollowingsQueryDto): Promise<ResponsePayload<User>> {
    const { limit, page, userId: targetUserId, search } = query;
    const [targetUser, areUsersMutuallyOrPartiallyBlocked] = await Promise.all([
      this.userModel.findOne({
        _id: targetUserId,
        isViewable: true,
      }),
      this.userBlockHelperService.areUsersMutuallyOrPartiallyBlocked(userId, targetUserId),
    ]);

    if (targetUserId && (!targetUser || targetUser?.isPrivate || areUsersMutuallyOrPartiallyBlocked)) {
      throw new NotFoundException(errorManager.USER_NOT_FOUND);
    }

    if (search) {
      return this.getSearchedFollowings(userId, query);
    }

    const matchStage = [
      {
        $match: {
          follower: new Types.ObjectId(targetUserId || userId),
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.userFollowModel.aggregate(matchStage).count('total'),
      this.userFollowModel.aggregate([
        ...matchStage,
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ page, limit }),
        ...getFollowingsPipeline(userId),
      ]),
    ]);

    return {
      data: docs,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  private async getSearchedFollowings(
    userId: string,
    { page, limit, search, userId: targetUserId }: GetUserFollowingsQueryDto,
  ): Promise<ResponsePayload<User>> {
    const payload: UserFollowingRpcPayload = {
      page,
      limit,
      search,
      userId,
      targetUserId,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_USER_GET_USER_FOLLOWINGS_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.userFollowModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getFollowingsPipeline(userId),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getBlockedUsers(userId: string) {
    const users = await this.userBlockModel.aggregate([
      {
        $match: {
          blocker: new Types.ObjectId(userId),
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { blocked: '$blocked' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$blocked'],
                },
              },
            },
            {
              $project: {
                firstName: 1,
                lastName: 1,
                profilePictureMedia: 1,
                username: 1,
              },
            },
          ],
          as: 'blocked',
        },
      },
      {
        $unwind: {
          path: '$blocked',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$blocked'],
          },
        },
      },
    ]);

    return users;
  }

  async getPendingFollowers(userId: string, { page, limit }: BasePaginationQuery) {
    const [users, total] = await Promise.all([
      this.pendingUserFollowModel.aggregate([
        {
          $match: {
            following: new Types.ObjectId(userId),
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ page, limit }),
        {
          $lookup: {
            from: 'users',
            let: { follower: '$follower' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', '$$follower'],
                  },
                },
              },
              ...getIsUserFollowed(userId),
              {
                $project: {
                  firstName: 1,
                  lastName: 1,
                  profilePictureMedia: 1,
                  username: 1,
                  gender: 1,
                  dynamicLink: 1,
                  totalPosts: 1,
                  totalPets: 1,
                  totalFollowers: 1,
                  totalUserFollowings: 1,
                  totalPetFollowings: 1,
                  isFollowed: 1,
                  isPendingFollow: 1,
                  isFollowingMe: 1,
                  isUserPendingFollowOnMe: 1,
                },
              },
            ],
            as: 'follower',
          },
        },
        {
          $unwind: {
            path: '$follower',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $replaceRoot: {
            newRoot: '$follower',
          },
        },
      ]),
      this.pendingUserFollowModel.countDocuments({
        following: new Types.ObjectId(userId),
      }),
    ]);

    return {
      data: users,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  async blockUser(userId: string, { userId: targetUserId }: UserIdParamDto) {
    if (userId === targetUserId) {
      throw new BadRequestException(errorManager.CANNOT_BLOCK_YOURSELF);
    }

    const [targetUser, areUsersMutuallyOrPartiallyBlocked] = await Promise.all([
      this.userModel.findOne({
        _id: targetUserId,
        isViewable: true,
      }),
      this.userBlockHelperService.areUsersMutuallyOrPartiallyBlocked(userId, targetUserId),
    ]);

    if (!targetUser || areUsersMutuallyOrPartiallyBlocked) {
      throw new NotFoundException(errorManager.USER_NOT_FOUND);
    }

    await new this.userBlockModel({
      blocker: new Types.ObjectId(userId),
      blocked: new Types.ObjectId(targetUserId),
    }).save();
  }

  async unblockUser(userId: string, { userId: targetUserId }: UserIdParamDto) {
    if (userId === targetUserId) {
      throw new BadRequestException(errorManager.CANNOT_UNBLOCK_YOURSELF);
    }

    const [targetUser, existingBlock] = await Promise.all([
      this.userModel.findOne({
        _id: targetUserId,
        isViewable: true,
      }),
      this.userBlockModel.findOne({
        blocker: new Types.ObjectId(userId),
        blocked: new Types.ObjectId(targetUserId),
      }),
    ]);

    if (!targetUser) {
      throw new NotFoundException(errorManager.USER_NOT_FOUND);
    }

    if (!existingBlock) {
      throw new BadRequestException(errorManager.USER_NOT_BLOCKED);
    }

    await existingBlock.deleteDoc();
  }

  async getUsers(userId: string, query: BaseSearchPaginationQuery): Promise<ResponsePayload<User>> {
    const { page, limit, search } = query;

    if (search) {
      return this.getSearchedUsers(query);
    }
    const matchStage = [
      {
        $match: {
          isViewable: true,
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.userModel.aggregate(matchStage).count('total'),
      this.userModel.aggregate([...matchStage, ...addPaginationStages({ limit, page }), ...getUsersPipeline()]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  private async getSearchedUsers({ page, limit, search }: BaseSearchPaginationQuery): Promise<ResponsePayload<User>> {
    const payload: BaseSearchPaginationQuery = {
      page,
      limit,
      search,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_USER_GET_USERS_SEARCH_DATA,
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
}
