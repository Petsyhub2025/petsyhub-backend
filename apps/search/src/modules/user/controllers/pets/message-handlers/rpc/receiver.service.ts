import { Injectable } from '@nestjs/common';
import {
  BaseSearchPaginationQuery,
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
    routingKey: RabbitRoutingKeys.SEARCH_RPC_USER_GET_PETS_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_USER_GET_PETS_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getPetsSearchData(data: BaseSearchPaginationQuery) {
    return this.petsRpcHandlerService.getPetsSearchData(data);
  }
}
