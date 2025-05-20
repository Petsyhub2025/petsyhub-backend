import { Injectable } from '@nestjs/common';
import {
  ISubscribeAdminToTopicRpc,
  IUnsubscribeAdminFromTopicRpc,
  RPC,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
} from '@instapets-backend/common';
import { AdminNotificationsReceiverHandlerService } from './handler.service';

@Injectable()
export class AdminNotificationsReceiverService {
  constructor(private readonly adminNotificationsHandlerService: AdminNotificationsReceiverHandlerService) {}

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.NOTIFICATION_RPC_ADMIN_SUBSCRIBE_TO_TOPIC,
    queue: RabbitQueues.NOTIFICATION_RPC_ADMIN_SUBSCRIBE_TO_TOPIC,
    queueOptions: {
      durable: true,
    },
  })
  async subscribeAdminToTopic(data: ISubscribeAdminToTopicRpc) {
    await this.adminNotificationsHandlerService.subscribeToTopic(data);

    return {
      success: true,
    };
  }

  @RPC({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.NOTIFICATION_RPC_ADMIN_UNSUBSCRIBE_FROM_TOPIC,
    queue: RabbitQueues.NOTIFICATION_RPC_ADMIN_UNSUBSCRIBE_FROM_TOPIC,
    queueOptions: {
      durable: true,
    },
  })
  async unsubscribeAdminFromTopic(data: IUnsubscribeAdminFromTopicRpc) {
    await this.adminNotificationsHandlerService.unsubscribeFromTopic(data);

    return {
      success: true,
    };
  }
}
