import { Injectable } from '@nestjs/common';
import {
  FollowedPetsUserRpcPayload,
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
  UserFollowedPetsRpcPayload,
} from '@instapets-backend/common';
import { PetFollowsRpcHandlerService } from './handler.service';

@Injectable()
export class PetFollowsRpcReceiverService {
  constructor(private readonly petFollowsRpcHandlerService: PetFollowsRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_USER_GET_PET_FOLLOWERS_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_USER_GET_PET_FOLLOWERS_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getPetFollowersSearchData(data: UserFollowedPetsRpcPayload) {
    return this.petFollowsRpcHandlerService.getPetFollowersSearchData(data);
  }

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_USER_GET_FOLLOWED_PETS_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_USER_GET_FOLLOWED_PETS_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getFollowedPetsSearchData(data: FollowedPetsUserRpcPayload) {
    return this.petFollowsRpcHandlerService.getFollowedPetsSearchData(data);
  }
}
