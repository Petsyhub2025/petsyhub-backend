import { Injectable } from '@nestjs/common';
import {
  BaseSearchPaginationQuery,
  PostAdminRpcPayload,
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
} from '@instapets-backend/common';
import { PostsRpcHandlerService } from './handler.service';

@Injectable()
export class PostsRpcReceiverService {
  constructor(private readonly postsRpcHandlerService: PostsRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_POSTS_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_POSTS_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getPostsSearchData(data: PostAdminRpcPayload) {
    return this.postsRpcHandlerService.getPostsSearchData(data);
  }

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_POSTS_SEARCH_FILTER_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_POSTS_SEARCH_FILTER_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getPostsSearchFilterData(data: BaseSearchPaginationQuery) {
    return this.postsRpcHandlerService.getPostsSearchFilterData(data);
  }
}
