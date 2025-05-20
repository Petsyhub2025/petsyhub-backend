import {
  BaseSearchPaginationQuery,
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
  UserSegmentsAdminRpcPayload,
} from '@instapets-backend/common';
import { Injectable } from '@nestjs/common';
import { UserSegmentsRpcHandlerService } from './handler.service';

@Injectable()
export class UserSegmentsRpcReceiverService {
  constructor(private readonly userSegmentsRpcHandlerService: UserSegmentsRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_USER_SEGMENTS_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_USER_SEGMENTS_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getUserSegmentsSearchData(data: UserSegmentsAdminRpcPayload) {
    return this.userSegmentsRpcHandlerService.getUserSegmentsSearchData(data);
  }

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_USER_SEGMENTS_SEARCH_FILTER_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_USER_SEGMENTS_SEARCH_FILTER_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getUserSegmentsSearchFilterData(data: BaseSearchPaginationQuery) {
    return this.userSegmentsRpcHandlerService.getUserSegmentsSearchFilterData(data);
  }
}
