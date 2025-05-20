import {
  BaseSearchPaginationQuery,
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
  UserPushNotificationAdminRpcPayload,
  UserSegmentsAdminRpcPayload,
} from '@instapets-backend/common';
import { Injectable } from '@nestjs/common';
import { UserPushNotificationsRpcHandlerService } from './handler.service';

@Injectable()
export class UserPushNotificationsRpcReceiverService {
  constructor(private readonly userPushNotificationsRpcHandlerService: UserPushNotificationsRpcHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_USER_PUSH_NOTIFICATIONS_SEARCH_DATA,
    queue: RabbitQueues.SEARCH_RPC_ADMIN_GET_USER_PUSH_NOTIFICATIONS_SEARCH_DATA,
    queueOptions: {
      durable: true,
    },
  })
  async getUserPushNotificationsSearchData(data: UserPushNotificationAdminRpcPayload) {
    return this.userPushNotificationsRpcHandlerService.getUserPushNotificationsSearchData(data);
  }
}
