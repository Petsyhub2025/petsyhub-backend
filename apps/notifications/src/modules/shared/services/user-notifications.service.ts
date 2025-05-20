import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  getAuthorFromAuthorUsers,
  processNotificationBody,
  processNotificationDeepLink,
} from '@notifications/shared-module/helpers/notification.helper';
import {
  CustomLoggerService,
  FCMTokenPayload,
  IUserFCMTokenModel,
  IUserModel,
  IUserNotificationModel,
  ModelNames,
  User,
  UserFCMService,
  UserNotification,
  UserNotificationDto,
  addMaintainOrderStages,
} from '@instapets-backend/common';
import { HydratedDocument, Types } from 'mongoose';

@Injectable()
export class UserNotificationsService {
  constructor(
    @Inject(ModelNames.USER_NOTIFICATION)
    private userNotificationModel: IUserNotificationModel,
    @Inject(ModelNames.USER_FCM_TOKEN)
    private userFCMTokenModel: IUserFCMTokenModel,
    @Inject(ModelNames.USER)
    private userModel: IUserModel,
    private readonly userFCMService: UserFCMService,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: CustomLoggerService,
  ) {}

  async sendNotification(notification: UserNotificationDto): Promise<void>;
  async sendNotification(notifications: UserNotificationDto[]): Promise<void>;
  async sendNotification(notification: UserNotificationDto | UserNotificationDto[]): Promise<void> {
    if (Array.isArray(notification)) {
      await this.bulkSendUserNotifications(notification);
      return;
    }

    await this.sendUserNotification(notification);
  }

  async sendUserChatNotification(notification: UserNotificationDto): Promise<void>;
  async sendUserChatNotification(notification: UserNotificationDto[]): Promise<void>;
  async sendUserChatNotification(notification: UserNotificationDto | UserNotificationDto[]): Promise<void> {
    if (Array.isArray(notification)) {
      await this.bulkSendUserNotifications(notification, false);
      return;
    }

    await this.sendUserNotification(notification, false);
  }

  private async sendUserNotification(notification: UserNotificationDto, saveToMongo = true) {
    const {
      body,
      data: notificationData,
      notificationType,
      deepLink,
      dynamicLink,
      receiverUserId,
      title,
      imageMedia,
      priority,
      timeToLive,
    } = notification;

    const { tokens, language } = await this.getReceiverUserData(receiverUserId);

    const data = {
      ...notificationData,
      notificationType,
      deepLink,
      dynamicLink,
    };

    const authorUserIds = processNotificationDeepLink(deepLink).map((author) => new Types.ObjectId(author));

    const authorUsers = await this.userModel.aggregate([
      {
        $match: {
          _id: {
            $in: authorUserIds,
          },
        },
      },
      ...addMaintainOrderStages({ input: authorUserIds }),
      {
        $project: {
          firstName: 1,
          lastName: 1,
          profilePictureMedia: 1,
        },
      },
    ]);

    this.eventEmitter.emit('FCM.sendUserSingleOrMulticast', {
      body: this.processNotificationBody(body[language], authorUsers),
      title: title[language],
      tokens,
      data,
      imageUrl: imageMedia?.url,
      priority,
      timeToLive,
    } as FCMTokenPayload);

    if (!saveToMongo) return;

    const userNotification: Partial<UserNotification> = {
      receiverUser: new Types.ObjectId(receiverUserId),
      title,
      body,
      deepLink,
      imageMedia,
      notificationType,
    };

    const newUserNotification = new this.userNotificationModel(userNotification);

    await newUserNotification.save();
  }

  private async bulkSendUserNotifications(notifications: UserNotificationDto[], saveToMongo = true) {
    const fcmMessages: FCMTokenPayload[] = [];
    const userNotificationsBulkOps = this.userNotificationModel.collection.initializeUnorderedBulkOp();

    for (const notification of notifications) {
      const {
        body,
        data: notificationData,
        notificationType,
        deepLink,
        dynamicLink,
        receiverUserId,
        title,
        imageMedia,
        priority,
        timeToLive,
      } = notification;

      const { tokens, language } = await this.getReceiverUserData(receiverUserId);

      const data = {
        ...notificationData,
        notificationType,
        deepLink,
        dynamicLink,
      };

      const authorUserIds = processNotificationDeepLink(deepLink).map((author) => new Types.ObjectId(author));

      const authorUsers = await this.userModel.aggregate([
        {
          $match: {
            _id: {
              $in: authorUserIds,
            },
          },
        },
        ...addMaintainOrderStages({ input: authorUserIds }),
        {
          $project: {
            firstName: 1,
            lastName: 1,
            profilePictureMedia: 1,
          },
        },
      ]);

      const fcmMessage: FCMTokenPayload = {
        body: this.processNotificationBody(body[language], authorUsers),
        title: title[language],
        tokens,
        data,
        imageUrl: imageMedia?.url,
        priority,
        timeToLive,
      };

      if (tokens?.length) fcmMessages.push(fcmMessage);

      const userNotification: Partial<UserNotification> = {
        receiverUser: new Types.ObjectId(receiverUserId),
        title,
        body,
        deepLink,
        imageMedia,
        notificationType,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      userNotificationsBulkOps.insert(userNotification);
    }

    this.eventEmitter.emit('FCM.sendUserBatchNotifications', fcmMessages as FCMTokenPayload[]);

    if (!saveToMongo) return;

    userNotificationsBulkOps.execute().catch((error) => {
      this.logger.error('Bulk Insert Error', { error });
    });
  }

  private async getReceiverUserData(receiverUserId: string) {
    const receiverUser = await this.userModel.findById(receiverUserId);

    const receiverUserFCMTokens = await this.userFCMTokenModel.find({
      user: receiverUser._id,
    });

    const tokens = receiverUserFCMTokens?.map((relation) => relation.fcmToken);

    return { tokens, language: receiverUser.settings?.language || 'en' };
  }

  private processNotificationBody(body: string, authorUsers: HydratedDocument<User>[]) {
    if (!authorUsers?.length) {
      return body;
    }

    const author: string = getAuthorFromAuthorUsers(authorUsers);

    return processNotificationBody(body, author);
  }
}
