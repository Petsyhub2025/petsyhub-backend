import {
  IMarketingUserPushNotificationMulticastEvent,
  ISendUserTopicNotificationEvent,
  Listen,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
} from '@instapets-backend/common';
import { Injectable } from '@nestjs/common';
import { UserNotificationsHandlerService } from './handler.service';

@Injectable()
export class UserNotificationsListenerService {
  constructor(private readonly userNotificationsHandlerService: UserNotificationsHandlerService) {}

  @Listen({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.NOTIFICATION_EVENTS_USER_SEND_TOPIC_NOTIFICATION,
    queue: RabbitQueues.NOTIFICATION_EVENTS_USER_SEND_TOPIC_NOTIFICATION,
    queueOptions: {
      durable: true,
    },
  })
  async sendUserNotification(data: ISendUserTopicNotificationEvent) {
    await this.userNotificationsHandlerService.sendNotification(data);
  }

  @Listen({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.NOTIFICATION_EVENTS_USER_SEND_MARKETING_USER_PUSH_NOTIFICATION,
    queue: RabbitQueues.NOTIFICATION_EVENTS_USER_SEND_MARKETING_USER_PUSH_NOTIFICATION,
    queueOptions: {
      durable: true,
    },
  })
  async sendMarketingUserPushNotification(data: IMarketingUserPushNotificationMulticastEvent) {
    await this.userNotificationsHandlerService.sendMarketingUserPushNotification(data);
  }
}
