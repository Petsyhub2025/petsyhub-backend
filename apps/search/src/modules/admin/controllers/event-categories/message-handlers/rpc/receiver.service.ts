import { Injectable } from '@nestjs/common';
import {
  BaseSearchPaginationQuery,
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
} from '@instapets-backend/common';
import { EventCategoriesRpcHandlerService } from './handler.service';

@Injectable()
export class EventCategoriesRpcReceiverService {
  constructor(private readonly eventCategoriesRpcHandlerService: EventCategoriesRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_EVENT_CATEGORIES_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_EVENT_CATEGORIES_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getEventCategoriesSearchData(data: BaseSearchPaginationQuery) {
    return this.eventCategoriesRpcHandlerService.getEventCategoriesSearchData(data);
  }
}
