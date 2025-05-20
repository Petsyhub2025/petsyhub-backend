import { Injectable } from '@nestjs/common';
import {
  BaseSearchPaginationQuery,
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
} from '@instapets-backend/common';
import { PetTypesRpcHandlerService } from './handler.service';

@Injectable()
export class PetTypesRpcReceiverService {
  constructor(private readonly petTypesRpcHandlerService: PetTypesRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_PET_TYPES_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_PET_TYPES_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getPetTypesSearchData(data: BaseSearchPaginationQuery) {
    return this.petTypesRpcHandlerService.getPetTypesSearchData(data);
  }
}
