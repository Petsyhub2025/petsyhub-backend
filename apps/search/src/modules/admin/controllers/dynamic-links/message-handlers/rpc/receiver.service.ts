import {
  BaseSearchPaginationQuery,
  DynamicLinksAdminRpcPayload,
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
} from '@instapets-backend/common';
import { Injectable } from '@nestjs/common';
import { DynamicLinksRpcHandlerService } from './handler.service';

@Injectable()
export class DynamicLinksRpcReceiverService {
  constructor(private readonly dynamicLinksRpcHandlerService: DynamicLinksRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_DYNAMIC_LINKS_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_DYNAMIC_LINKS_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getDynamicLinksSearchData(data: DynamicLinksAdminRpcPayload) {
    return this.dynamicLinksRpcHandlerService.getDynamicLinksSearchData(data);
  }

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_DYNAMIC_LINKS_SEARCH_FILTER_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_DYNAMIC_LINKS_SEARCH_FILTER_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getDynamicLinksSearchFilterData(data: BaseSearchPaginationQuery) {
    return this.dynamicLinksRpcHandlerService.getDynamicLinksSearchFilterData(data);
  }
}
