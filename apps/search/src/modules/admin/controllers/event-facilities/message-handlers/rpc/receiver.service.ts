import { Injectable } from '@nestjs/common';
import {
  BaseSearchPaginationQuery,
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
} from '@instapets-backend/common';
import { EventFacilitiesRpcHandlerService } from './handler.service';

@Injectable()
export class EventFacilitiesRpcReceiverService {
  constructor(private readonly eventFacilitiesRpcHandlerService: EventFacilitiesRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_EVENT_FACILITIES_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_EVENT_FACILITIES_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getEventFacilitiesSearchData(data: BaseSearchPaginationQuery) {
    return this.eventFacilitiesRpcHandlerService.getEventFacilitiesSearchData(data);
  }
}
