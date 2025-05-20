import { Injectable } from '@nestjs/common';
import {
  BaseSearchPaginationQuery,
  PetAdminRpcPayload,
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
} from '@instapets-backend/common';
import { PetsRpcHandlerService } from './handler.service';

@Injectable()
export class PetsRpcReceiverService {
  constructor(private readonly petsRpcHandlerService: PetsRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_PETS_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_PETS_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getPetsSearchData(data: PetAdminRpcPayload) {
    return this.petsRpcHandlerService.getPetsSearchData(data);
  }

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_PETS_SEARCH_FILTER_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_PETS_SEARCH_FILTER_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getPetsSearchFilterData(data: BaseSearchPaginationQuery) {
    return this.petsRpcHandlerService.getPetsSearchFilterData(data);
  }
}
