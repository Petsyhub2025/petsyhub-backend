import { Injectable } from '@nestjs/common';
import {
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
  UserFollowersRpcPayload,
  UserFollowingRpcPayload,
} from '@instapets-backend/common';
import { UserFollowsRpcHandlerService } from './handler.service';

@Injectable()
export class UserFollowsRpcReceiverService {
  constructor(private readonly userFollowsRpcHandlerService: UserFollowsRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_USER_GET_USER_FOLLOWERS_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_USER_GET_USER_FOLLOWERS_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getUserFollowersSearchData(data: UserFollowersRpcPayload) {
    return this.userFollowsRpcHandlerService.getUserFollowersSearchData(data);
  }

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_USER_GET_USER_FOLLOWINGS_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_USER_GET_USER_FOLLOWINGS_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getUserFollowingsSearchData(data: UserFollowingRpcPayload) {
    return this.userFollowsRpcHandlerService.getUserFollowingsSearchData(data);
  }
}
