import { ISendServiceProviderNotificationEvent } from '@instapets-backend/common';
import { Injectable } from '@nestjs/common';
import { ServiceProviderNotificationsService } from '@notifications/shared-module/services/service-provider-notifications.service';

@Injectable()
export class ServiceProviderNotificationsHandlerService {
  constructor(private readonly serviceProviderNotificationsService: ServiceProviderNotificationsService) {}

  async sendNotification(data: ISendServiceProviderNotificationEvent) {
    await this.serviceProviderNotificationsService.sendServiceProviderNotification(data);
  }
}
