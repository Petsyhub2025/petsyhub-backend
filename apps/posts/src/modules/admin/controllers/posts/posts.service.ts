import { errorManager } from '@posts/admin/shared/config/error-manager.config';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PostIdParamDto } from '@posts/shared-module/dto/post-id-param.dto';
import {
  IPostModel,
  ISearchResponseData,
  ModelNames,
  Post,
  PostAdminRpcPayload,
  RabbitExchanges,
  RabbitRoutingKeys,
  ResponsePayload,
  RpcResponse,
  addMaintainOrderStages,
  addPaginationStages,
} from '@instapets-backend/common';
import { Types } from 'mongoose';
import { getPostAggregationPipeline } from './aggregations/get-post.aggregation';
import { getPostsAggregationPipeline } from './aggregations/get-posts.aggregation';
import { GetPostsQueryDto } from './dto/get-posts.dto';

@Injectable()
export class PostsService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    @Inject(ModelNames.POST) private postModel: IPostModel,
  ) {}

  async getPosts(query: GetPostsQueryDto) {
    const { page, limit, search, userId, petId } = query;

    if (search) {
      return this.getSearchedPosts(query);
    }
    const matchStage = [
      {
        $match: {
          ...(petId && { authorPet: new Types.ObjectId(petId) }),
          ...(userId && { authorUser: new Types.ObjectId(userId) }),
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.postModel.aggregate(matchStage).count('total'),
      this.postModel.aggregate([
        ...matchStage,
        { $sort: { _id: -1 } },
        ...addPaginationStages({ limit, page }),
        ...getPostsAggregationPipeline(),
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  private async getSearchedPosts({
    page,
    limit,
    search,
    petId,
    userId,
  }: GetPostsQueryDto): Promise<ResponsePayload<Post>> {
    const payload: PostAdminRpcPayload = {
      page,
      limit,
      search,
      authorPetId: petId,
      authorUserId: userId,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_POSTS_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.postModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getPostsAggregationPipeline(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getPostById({ postId }: PostIdParamDto) {
    const post = await this.postModel.findById(postId);

    if (!post) {
      throw new NotFoundException(errorManager.POST_NOT_FOUND);
    }

    const pipeline = [
      {
        $match: {
          _id: new Types.ObjectId(postId),
        },
      },
      ...getPostAggregationPipeline(),
    ];

    const [populatedPost] = await this.postModel.aggregate(pipeline);

    return populatedPost;
  }

  async deletePost({ postId }: PostIdParamDto) {
    const post = await this.postModel.findById(postId);

    if (!post) {
      throw new NotFoundException(errorManager.POST_NOT_FOUND);
    }

    await post.deleteDoc();
  }

  async suspendPost({ postId }: PostIdParamDto) {
    const post = await this.postModel.findById(postId);

    if (!post) {
      throw new NotFoundException(errorManager.POST_NOT_FOUND);
    }

    await post.suspendDoc();
  }
}
