import { Injectable } from '@nestjs/common';
import {
  ISubscribeUserToTopicRpc,
  IUnsubscribeUserFromTopicRpc,
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
} from '@instapets-backend/common';
import { UserNotificationsReceiverHandlerService } from './handler.service';

@Injectable()
export class UserNotificationsReceiverService {
  constructor(private readonly userNotificationsHandlerService: UserNotificationsReceiverHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.NOTIFICATION_RPC_USER_SUBSCRIBE_TO_TOPIC,
    queue: RabbitQueues.NOTIFICATION_RPC_USER_SUBSCRIBE_TO_TOPIC,
    queueOptions: {
      durable: true,
    },
  })
  async subscribeUserToTopic(data: ISubscribeUserToTopicRpc) {
    await this.userNotificationsHandlerService.subscribeToTopic(data);

    return {
      success: true,
    };
  }

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.NOTIFICATION_RPC_USER_UNSUBSCRIBE_FROM_TOPIC,
    queue: RabbitQueues.NOTIFICATION_RPC_USER_UNSUBSCRIBE_FROM_TOPIC,
    queueOptions: {
      durable: true,
    },
  })
  async unsubscribeUserFromTopic(data: IUnsubscribeUserFromTopicRpc) {
    await this.userNotificationsHandlerService.unsubscribeFromTopic(data);

    return {
      success: true,
    };
  }
}
