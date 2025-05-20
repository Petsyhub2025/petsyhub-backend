import { ModelNames, RabbitExchanges, RabbitRoutingKeys } from '@common/constants';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  FoundPost,
  FoundPostAdminRpcPayload,
  IFoundPostModel,
  ISearchResponseData,
  ResponsePayload,
  RpcResponse,
  addMaintainOrderStages,
  addPaginationStages,
} from '@instapets-backend/common';
import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { errorManager } from '@pets/admin/shared/config/errors.config';
import { FoundPostIdParamDto } from '@pets/admin/shared/dto/found-post-id-param.dto';
import { PipelineStage, Types } from 'mongoose';
import { GetFoundPostsQueryDto } from './dto/get-found-posts.dto';
import { getFoundPostAggregationPipeline, getFoundPostsPipeLine } from './helpers/found-posts-pipeline.helper';

@Injectable()
export class FoundPostsService {
  constructor(
    @Inject(ModelNames.FOUND_POST) private foundPostModel: IFoundPostModel,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async getFoundPosts(userId: string, query: GetFoundPostsQueryDto): Promise<ResponsePayload<FoundPost>> {
    const { limit, page, search, authorUserId, cityId, countryId, dateFrom, dateTo, sortBy, sortOrder } = query;

    if (search) {
      return this.getSearchedFoundPosts(query);
    }

    const matchStage: PipelineStage[] = [
      {
        $match: {
          ...(authorUserId ? { authorUser: new Types.ObjectId(authorUserId) } : {}),
          ...(cityId ? { 'locationData.city': new Types.ObjectId(cityId) } : {}),
          ...(countryId ? { 'locationData.country': new Types.ObjectId(countryId) } : {}),
          ...((dateFrom || dateTo) && {
            createdAt: { ...(dateFrom && { $gte: dateFrom }), ...(dateTo && { $lte: dateTo }) },
          }),
        },
      },
    ];

    const [foundPosts, [{ total = 0 } = {}]] = await Promise.all([
      this.foundPostModel.aggregate([
        ...matchStage,
        {
          $sort: {
            ...(sortBy && { [sortBy]: sortOrder }),
            _id: -1,
          },
        },
        ...addPaginationStages({ limit, page }),
        ...getFoundPostsPipeLine(),
      ]),
      this.foundPostModel.aggregate([...matchStage]).count('total'),
    ]);

    return {
      data: foundPosts,
      total,
      limit,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  private async getSearchedFoundPosts({
    page,
    limit,
    search,
    authorUserId,
    cityId,
    countryId,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
  }: GetFoundPostsQueryDto): Promise<ResponsePayload<FoundPost>> {
    const payload: FoundPostAdminRpcPayload = {
      page,
      limit,
      search,
      authorUserId,
      cityId,
      countryId,
      ...(dateFrom && { dateFrom: dateFrom.toISOString() }),
      ...(dateTo && { dateTo: dateTo.toISOString() }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_FOUND_POSTS_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.foundPostModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getFoundPostsPipeLine(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getFoundPostDetails(userId: string, { foundPostId }: FoundPostIdParamDto) {
    const foundPost = await this.getFoundPostById(foundPostId, userId);

    if (!foundPost) {
      throw new NotFoundException(errorManager.FOUND_POST_NOT_FOUND);
    }

    return foundPost;
  }

  async deleteFoundPost(adminId: string, { foundPostId }: FoundPostIdParamDto) {
    const oldFoundPost = await this.foundPostModel.findOne({
      _id: foundPostId,
    });

    if (!oldFoundPost) {
      throw new NotFoundException(errorManager.FOUND_POST_NOT_FOUND);
    }

    await oldFoundPost.deleteDoc();
  }

  async suspendFoundPost(adminId: string, { foundPostId }: FoundPostIdParamDto) {
    const foundPost = await this.foundPostModel.findById(foundPostId);
    if (!foundPost) {
      throw new NotFoundException(errorManager.FOUND_POST_NOT_FOUND);
    }
    await foundPost.suspendDoc();
  }

  async unSuspendFoundPost(adminId: string, { foundPostId }: FoundPostIdParamDto) {
    const foundPost = await this.foundPostModel.findById(foundPostId);
    if (!foundPost) {
      throw new NotFoundException(errorManager.FOUND_POST_NOT_FOUND);
    }

    await foundPost.unSuspendDoc();
  }

  private async getFoundPostById(_id: string | Types.ObjectId, viewerId: string) {
    const [foundPost] = await this.foundPostModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(_id),
        },
      },
      ...getFoundPostAggregationPipeline(viewerId),
    ]);

    return foundPost;
  }
}
