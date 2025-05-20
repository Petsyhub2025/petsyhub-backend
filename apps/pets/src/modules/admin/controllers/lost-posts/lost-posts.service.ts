import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  ILostPostModel,
  IPetModel,
  ISearchResponseData,
  LostPost,
  LostPostAdminRpcPayload,
  ModelNames,
  RabbitExchanges,
  RabbitRoutingKeys,
  ResponsePayload,
  RpcResponse,
  addMaintainOrderStages,
  addPaginationStages,
} from '@instapets-backend/common';
import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { errorManager } from '@pets/admin/shared/config/errors.config';
import { LostPostIdParamDto } from '@pets/admin/shared/dto/lost-post-id-param.dto';
import { Connection, PipelineStage, Types } from 'mongoose';
import { GetLostPostsQueryDto } from './dto/get-lost-posts.dto';
import { getLostPostAggregationPipeline, getLostPostsPipeline } from './helpers/lost-posts-pipeline.helper';

@Injectable()
export class LostPostsService {
  constructor(
    @Inject(ModelNames.PET) private petModel: IPetModel,
    @Inject(ModelNames.LOST_POST) private lostPostModel: ILostPostModel,
    @InjectConnection() private readonly connection: Connection,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async getLostPosts(adminId: string, query: GetLostPostsQueryDto): Promise<ResponsePayload<LostPost>> {
    const {
      limit,
      page,
      search,
      authorUserId,
      petId,
      cityId,
      countryId,
      isFound,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = query;

    if (search) {
      return this.getSearchedLostPosts(query);
    }

    const matchStage: PipelineStage[] = [
      {
        $match: {
          ...(authorUserId ? { authorUser: new Types.ObjectId(authorUserId) } : {}),
          ...(petId ? { pet: new Types.ObjectId(petId) } : {}),
          ...(cityId ? { 'locationData.city': new Types.ObjectId(cityId) } : {}),
          ...(countryId ? { 'locationData.country': new Types.ObjectId(countryId) } : {}),
          ...(isFound ? { isFound } : {}),
          ...((dateFrom || dateTo) && {
            createdAt: { ...(dateFrom && { $gte: dateFrom }), ...(dateTo && { $lte: dateTo }) },
          }),
        },
      },
    ];

    const [lostPosts, [{ total = 0 } = {}]] = await Promise.all([
      this.lostPostModel.aggregate([
        ...matchStage,
        {
          $sort: {
            ...(sortBy && { [sortBy]: sortOrder }),
            _id: -1,
          },
        },
        ...addPaginationStages({ limit, page }),
        ...getLostPostsPipeline(),
      ]),
      this.lostPostModel.aggregate([...matchStage]).count('total'),
    ]);

    return {
      data: lostPosts,
      total,
      limit,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  private async getSearchedLostPosts({
    page,
    limit,
    search,
    petId,
    authorUserId,
    cityId,
    countryId,
    isFound,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
  }: GetLostPostsQueryDto): Promise<ResponsePayload<LostPost>> {
    const payload: LostPostAdminRpcPayload = {
      page,
      limit,
      search,
      petId,
      authorUserId,
      cityId,
      countryId,
      isFound,
      ...(dateFrom && { dateFrom: dateFrom.toISOString() }),
      ...(dateTo && { dateTo: dateTo.toISOString() }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_LOST_POSTS_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.lostPostModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getLostPostsPipeline(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getLostPostDetails(adminId: string, { lostPostId }: LostPostIdParamDto) {
    const lostPost = await this.getLostPostById(lostPostId);

    if (!lostPost) {
      throw new NotFoundException(errorManager.LOST_POST_NOT_FOUND);
    }

    return lostPost;
  }

  async deleteLostPost(adminId: string, { lostPostId }: LostPostIdParamDto) {
    const session = await this.connection.startSession();
    session.startTransaction({
      readPreference: 'primary',
    });

    try {
      const oldLostPost = await this.lostPostModel
        .findOne({
          _id: lostPostId,
        })
        .session(session);

      if (!oldLostPost) {
        throw new NotFoundException(errorManager.LOST_POST_NOT_FOUND);
      }

      await oldLostPost.deleteDoc(session);

      const pet = await this.petModel
        .findOne({
          _id: oldLostPost.pet,
        })
        .session(session);

      if (pet) {
        pet.isLost = false;
        await pet.save({ session });
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async suspendLostPost(adminId: string, { lostPostId }: LostPostIdParamDto) {
    const lostPost = await this.lostPostModel.findById(lostPostId);
    if (!lostPost) {
      throw new NotFoundException(errorManager.LOST_POST_NOT_FOUND);
    }
    await lostPost.suspendDoc();
  }

  async unSuspendLostPost(adminId: string, { lostPostId }: LostPostIdParamDto) {
    const lostPost = await this.lostPostModel.findById(lostPostId);
    if (!lostPost) {
      throw new NotFoundException(errorManager.LOST_POST_NOT_FOUND);
    }

    await lostPost.unSuspendDoc();
  }

  private async getLostPostById(_id: string | Types.ObjectId) {
    const [lostPost] = await this.lostPostModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(_id),
        },
      },
      ...getLostPostAggregationPipeline(),
    ]);

    return lostPost;
  }
}
