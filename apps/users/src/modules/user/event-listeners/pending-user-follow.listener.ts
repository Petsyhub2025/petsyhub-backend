import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  DeepLinkModelsEnum,
  DeepLinkService,
  EventListenerErrorHandlerService,
  IUserModel,
  ModelNames,
  NotificationsHelperService,
  PendingUserFollow,
  PendingUserFollowEventsEnum,
  UserNotificationDto,
  UserNotificationTypeEnum,
} from '@instapets-backend/common';
import { HydratedDocument } from 'mongoose';

@Injectable()
export class PendingUserFollowEventListener {
  constructor(
    private readonly errorHandler: EventListenerErrorHandlerService,
    private readonly deepLinkService: DeepLinkService,
    private readonly notificationsHelperService: NotificationsHelperService,
    @Inject(ModelNames.USER) private userModel: IUserModel,
  ) {}

  @OnEvent(PendingUserFollowEventsEnum.SEND_NOTIFICATION, { promisify: true })
  async handle(event: HydratedDocument<PendingUserFollow>) {
    await this.errorHandler.eventListenerErrorHandler(
      PendingUserFollowEventsEnum.SEND_NOTIFICATION,
      this.sendNotification.bind(this, event),
    );
  }

  private async sendNotification(doc: HydratedDocument<PendingUserFollow>) {
    if (!this.isPendingUserFollow(doc)) {
      throw new Error('Invalid PendingUserFollow document');
    }

    const [follower, following] = await Promise.all([
      this.userModel.findById(doc.follower),
      this.userModel.findById(doc.following),
    ]);

    if (!follower || !following) {
      throw new Error('Invalid PendingUserFollow document');
    }

    const receiverId = following._id;
    const deepLink = this.deepLinkService.generateUserDeepLink({
      modelId: follower._id.toString(),
      modelName: DeepLinkModelsEnum.USERS,
      queryParams: {
        authorUser: follower._id.toString(),
      },
    });
    const title = {
      en: 'Follow Request ➕',
      ar: 'طلب متابعة ➕',
    };
    const body = {
      en: `@author has requested to follow you`,
      ar: `@author طلب متابعتك`,
    };

    if (follower._id.toString() === receiverId?.toString()) return;

    const notificationExists = await this.notificationsHelperService.validateNotificationExists({
      deepLink,
      notificationType: UserNotificationTypeEnum.PENDING_USER_FOLLOW,
      receiverUserId: receiverId.toString(),
    });

    if (notificationExists) return;

    const notification: UserNotificationDto = {
      title,
      body,
      receiverUserId: receiverId.toString(),
      deepLink,
      dynamicLink: follower.dynamicLink,
      notificationType: UserNotificationTypeEnum.PENDING_USER_FOLLOW,
    };

    await this.notificationsHelperService.sendUserNotificationToNotificationService(notification);
  }

  private isPendingUserFollow(doc: HydratedDocument<PendingUserFollow>): doc is HydratedDocument<PendingUserFollow> {
    return !!(doc?._id && doc?.follower && doc?.following);
  }
}
