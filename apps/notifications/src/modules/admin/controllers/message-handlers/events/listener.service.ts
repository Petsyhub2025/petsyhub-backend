import { Injectable } from '@nestjs/common';
import {
  ISendAdminNotificationEvent,
  Listen,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
} from '@instapets-backend/common';
import { AdminNotificationsHandlerService } from './handler.service';

@Injectable()
export class AdminNotificationsListenerService {
  constructor(private readonly adminNotificationsHandlerService: AdminNotificationsHandlerService) {}

  @Listen({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.NOTIFICATION_EVENTS_ADMIN_SEND_NOTIFICATION,
    queue: RabbitQueues.NOTIFICATION_EVENTS_ADMIN_SEND_NOTIFICATION,
    queueOptions: {
      durable: true,
    },
  })
  async sendAdminNotification(data: ISendAdminNotificationEvent) {
    await this.adminNotificationsHandlerService.sendNotification(data);
  }
}
