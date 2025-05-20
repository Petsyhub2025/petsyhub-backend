import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  AdminNotification,
  FCMTopicPayload,
  IAdminNotificationModel,
  ISendAdminNotificationEvent,
  ModelNames,
} from '@instapets-backend/common';

@Injectable()
export class AdminNotificationsService {
  constructor(
    @Inject(ModelNames.ADMIN_NOTIFICATION)
    private adminNotificationModel: IAdminNotificationModel,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async sendNotification(notification: ISendAdminNotificationEvent) {
    const {
      data: notificationData,
      notificationType,
      topic,
      body,
      title,
      imageMedia,
      priority,
      timeToLive,
      deepLink,
    } = notification;

    const data = {
      ...notificationData,
      notificationType,
      deepLink,
    };

    this.eventEmitter.emit('FCM.sendToAdminTopic', {
      topic: topic as string,
      body,
      title,
      imageUrl: imageMedia?.url,
      priority,
      timeToLive,
      data,
    } as FCMTopicPayload);

    const adminNotification: Partial<AdminNotification> = {
      body,
      title,
      deepLink,
      notificationType,
      imageMedia,
    };

    const newAdminNotification = new this.adminNotificationModel(adminNotification);

    await newAdminNotification.save();
  }
}
