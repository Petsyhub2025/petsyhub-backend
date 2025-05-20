import {
  BaseSearchPaginationQuery,
  FoundPostAdminRpcPayload,
  LostPostAdminRpcPayload,
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
} from '@instapets-backend/common';
import { Injectable } from '@nestjs/common';
import { LostFoundPostsRpcHandlerService } from './handler.service';

@Injectable()
export class LostFoundPostsRpcReceiverService {
  constructor(private readonly lostFoundPostsRpcHandlerService: LostFoundPostsRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_LOST_POSTS_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_LOST_POSTS_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getLostPostsSearchData(data: LostPostAdminRpcPayload) {
    return this.lostFoundPostsRpcHandlerService.getLostPostsSearchData(data);
  }

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_LOST_POSTS_SEARCH_FILTER_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_LOST_POSTS_SEARCH_FILTER_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getLostPostsSearchFilterData(data: BaseSearchPaginationQuery) {
    return this.lostFoundPostsRpcHandlerService.getLostPostsSearchFilterData(data);
  }

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_FOUND_POSTS_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_FOUND_POSTS_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getFoundPostsSearchData(data: FoundPostAdminRpcPayload) {
    return this.lostFoundPostsRpcHandlerService.getFoundPostsSearchData(data);
  }

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_FOUND_POSTS_SEARCH_FILTER_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_FOUND_POSTS_SEARCH_FILTER_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getFoundPostsSearchFilterData(data: BaseSearchPaginationQuery) {
    return this.lostFoundPostsRpcHandlerService.getFoundPostsSearchFilterData(data);
  }
}
