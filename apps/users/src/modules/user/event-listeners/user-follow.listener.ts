import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  DeepLinkModelsEnum,
  DeepLinkService,
  EventListenerErrorHandlerService,
  IUserModel,
  ModelNames,
  NotificationsHelperService,
  UserFollow,
  UserFollowEventsEnum,
  UserNotificationDto,
  UserNotificationTypeEnum,
} from '@instapets-backend/common';
import { HydratedDocument } from 'mongoose';

@Injectable()
export class UserFollowEventListener {
  constructor(
    private readonly errorHandler: EventListenerErrorHandlerService,
    private readonly deepLinkService: DeepLinkService,
    private readonly notificationsHelperService: NotificationsHelperService,
    @Inject(ModelNames.USER) private userModel: IUserModel,
  ) {}

  @OnEvent(UserFollowEventsEnum.SEND_NOTIFICATION, { promisify: true })
  async handle(event: HydratedDocument<UserFollow>) {
    await this.errorHandler.eventListenerErrorHandler(
      UserFollowEventsEnum.SEND_NOTIFICATION,
      this.sendNotification.bind(this, event),
    );
  }

  private async sendNotification(doc: HydratedDocument<UserFollow>) {
    if (!this.isUserFollow(doc)) {
      throw new Error('Invalid UserFollow document');
    }

    const [follower, following] = await Promise.all([
      this.userModel.findById(doc.follower),
      this.userModel.findById(doc.following),
    ]);

    if (!follower || !following) {
      throw new Error('Invalid UserFollow document');
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
      en: 'Follow ➕',
      ar: 'متابعة ➕',
    };
    const body = {
      en: `@author started following you`,
      ar: `@author بدأ بمتابعتك`,
    };

    if (follower._id.toString() === receiverId?.toString()) return;

    const notificationExists = await this.notificationsHelperService.validateNotificationExists({
      deepLink,
      notificationType: UserNotificationTypeEnum.USER_FOLLOW,
      receiverUserId: receiverId.toString(),
    });

    if (notificationExists) return;

    const notification: UserNotificationDto = {
      title,
      body,
      receiverUserId: receiverId.toString(),
      deepLink,
      dynamicLink: follower.dynamicLink,
      notificationType: UserNotificationTypeEnum.USER_FOLLOW,
    };

    await this.notificationsHelperService.sendUserNotificationToNotificationService(notification);
  }

  private isUserFollow(doc: HydratedDocument<UserFollow>): doc is HydratedDocument<UserFollow> {
    return !!(doc?._id && doc?.follower && doc?.following);
  }
}
