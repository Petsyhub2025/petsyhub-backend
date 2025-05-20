import { Injectable } from '@nestjs/common';
import {
  BaseSearchPaginationQuery,
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
  UserAdminRpcPayload,
} from '@instapets-backend/common';
import { UsersRpcHandlerService } from './handler.service';

@Injectable()
export class UsersRpcReceiverService {
  constructor(private readonly usersRpcHandlerService: UsersRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_USERS_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_USERS_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getUsersSearchData(data: UserAdminRpcPayload) {
    return this.usersRpcHandlerService.getUsersSearchData(data);
  }

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_USERS_SEARCH_FILTER_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_USERS_SEARCH_FILTER_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getUsersSearchFilterData(data: BaseSearchPaginationQuery) {
    return this.usersRpcHandlerService.getUsersSearchFilterData(data);
  }
}
