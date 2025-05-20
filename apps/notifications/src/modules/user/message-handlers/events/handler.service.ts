import {
  CustomLoggerService,
  FCMTokenPayload,
  FCMTopicPayload,
  IMarketingUserPushNotificationMulticastEvent,
  ISendUserTopicNotificationEvent,
  IUserNotificationModel,
  ModelNames,
  UserNotification,
} from '@instapets-backend/common';
import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Types } from 'mongoose';

@Injectable()
export class UserNotificationsHandlerService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: CustomLoggerService,
    @Inject(ModelNames.USER_NOTIFICATION) private userNotificationModel: IUserNotificationModel,
  ) {}

  async sendNotification(notification: ISendUserTopicNotificationEvent) {
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
      dynamicLink,
    } = notification;

    const data = {
      ...notificationData,
      notificationType,
      deepLink,
      dynamicLink,
    };

    this.eventEmitter.emit('FCM.sendToUserTopic', {
      topic: topic as string,
      body,
      title,
      imageUrl: imageMedia?.url,
      priority,
      timeToLive,
      data,
    } as FCMTopicPayload);
  }

  async sendMarketingUserPushNotification({
    userIds,
    fcmMessages,
    userNotification,
  }: IMarketingUserPushNotificationMulticastEvent) {
    for (const message of fcmMessages) {
      const {
        body,
        data: notificationData,
        notificationType,
        deepLink,
        dynamicLink,
        title,
        fcmTokens,
        ...restOfMessage
      } = message;

      const data = {
        ...notificationData,
        notificationType,
        deepLink,
        dynamicLink,
      };

      const payload: FCMTokenPayload = {
        tokens: fcmTokens,
        body: body,
        title: title,
        data,
        ...restOfMessage,
      };

      this.eventEmitter.emit('FCM.sendUserSingleOrMulticast', payload);
    }

    const userNotificationsBulkOps = this.userNotificationModel.collection.initializeUnorderedBulkOp();

    for (const userId of userIds) {
      const newUserNotification: Partial<UserNotification> = {
        receiverUser: new Types.ObjectId(userId),
        ...userNotification,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      userNotificationsBulkOps.insert(newUserNotification);
    }

    userNotificationsBulkOps.execute().catch((error) => {
      this.logger.error('userNotifications Bulk Insert Error', { error });
    });
  }
}
