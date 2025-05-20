import { Injectable } from '@nestjs/common';
import { AdminNotificationsService } from '@notifications/shared-module/services/admin-notifications.service';
import { ISendAdminNotificationEvent } from '@instapets-backend/common';

@Injectable()
export class AdminNotificationsHandlerService {
  constructor(private readonly adminNotificationsService: AdminNotificationsService) {}

  async sendNotification(data: ISendAdminNotificationEvent) {
    await this.adminNotificationsService.sendNotification(data);
  }
}
