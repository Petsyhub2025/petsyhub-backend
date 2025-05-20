import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  DeepLinkModelsEnum,
  DeepLinkService,
  EventListenerErrorHandlerService,
  IPetModel,
  IUserModel,
  ModelNames,
  NotificationsHelperService,
  PendingPetFollow,
  PendingPetFollowEventsEnum,
  UserNotificationDto,
  UserNotificationTypeEnum,
} from '@instapets-backend/common';
import { HydratedDocument } from 'mongoose';

@Injectable()
export class PendingPetFollowEventListener {
  constructor(
    private readonly errorHandler: EventListenerErrorHandlerService,
    private readonly deepLinkService: DeepLinkService,
    private readonly notificationsHelperService: NotificationsHelperService,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.PET) private petModel: IPetModel,
  ) {}

  @OnEvent(PendingPetFollowEventsEnum.SEND_NOTIFICATION, { promisify: true })
  async handle(event: HydratedDocument<PendingPetFollow>) {
    await this.errorHandler.eventListenerErrorHandler(
      PendingPetFollowEventsEnum.SEND_NOTIFICATION,
      this.sendNotification.bind(this, event),
    );
  }

  private async sendNotification(doc: HydratedDocument<PendingPetFollow>) {
    if (!this.isPendingPetFollow(doc)) {
      throw new Error('Invalid PendingPetFollow document');
    }

    const [follower, following] = await Promise.all([
      this.userModel.findById(doc.follower),
      this.petModel.findById(doc.following),
    ]);

    if (!follower || !following) {
      throw new Error('Invalid PendingPetFollow document');
    }

    const receiverId = following.user.userId;
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
      en: `@author has requested to follow your pet`,
      ar: `@author طلب متابعة حيوانك الاليف`,
    };

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
      imageMedia: following.profilePictureMedia,
    };

    await this.notificationsHelperService.sendUserNotificationToNotificationService(notification);
  }

  private isPendingPetFollow(doc: HydratedDocument<PendingPetFollow>): doc is HydratedDocument<PendingPetFollow> {
    return !!(doc?._id && doc?.follower && doc?.following);
  }
}
