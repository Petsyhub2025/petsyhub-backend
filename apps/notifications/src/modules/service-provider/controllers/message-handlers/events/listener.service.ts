import { Injectable } from '@nestjs/common';
import {
  ISendServiceProviderNotificationEvent,
  Listen,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
} from '@instapets-backend/common';
import { ServiceProviderNotificationsHandlerService } from './handler.service';

@Injectable()
export class ServiceProviderNotificationsListenerService {
  constructor(
    private readonly serviceProviderNotificationsHandlerService: ServiceProviderNotificationsHandlerService,
  ) {}

  @Listen({
    exchange: RabbitExchanges.SERVICE,
    routingKey: RabbitRoutingKeys.NOTIFICATION_EVENTS_SERVICE_PROVIDER_SEND_NOTIFICATION,
    queue: RabbitQueues.NOTIFICATION_EVENTS_SERVICE_PROVIDER_SEND_NOTIFICATION,
    queueOptions: {
      durable: true,
    },
  })
  async sendServiceProviderNotification(data: ISendServiceProviderNotificationEvent) {
    await this.serviceProviderNotificationsHandlerService.sendNotification(data);
  }
}
