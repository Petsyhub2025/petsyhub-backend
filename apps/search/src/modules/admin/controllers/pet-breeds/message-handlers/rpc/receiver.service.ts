import { Injectable } from '@nestjs/common';
import {
  PetBreedAdminRpcPayload,
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
} from '@instapets-backend/common';
import { PetBreedRpcHandlerService } from './handler.service';

@Injectable()
export class PetBreedRpcReceiverService {
  constructor(private readonly petBreedRpcHandlerService: PetBreedRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_PET_BREEDS_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_PET_BREEDS_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getPetBreedSearchData(data: PetBreedAdminRpcPayload) {
    return this.petBreedRpcHandlerService.getPetBreedSearchData(data);
  }
}
