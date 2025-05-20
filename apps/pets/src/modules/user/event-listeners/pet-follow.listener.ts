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
  PetFollow,
  PetFollowEventsEnum,
  UserNotificationDto,
  UserNotificationTypeEnum,
} from '@instapets-backend/common';
import { HydratedDocument } from 'mongoose';

@Injectable()
export class PetFollowEventListener {
  constructor(
    private readonly errorHandler: EventListenerErrorHandlerService,
    private readonly deepLinkService: DeepLinkService,
    private readonly notificationsHelperService: NotificationsHelperService,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.PET) private petModel: IPetModel,
  ) {}

  @OnEvent(PetFollowEventsEnum.SEND_NOTIFICATION, { promisify: true })
  async handle(event: HydratedDocument<PetFollow>) {
    await this.errorHandler.eventListenerErrorHandler(
      PetFollowEventsEnum.SEND_NOTIFICATION,
      this.sendNotification.bind(this, event),
    );
  }

  private async sendNotification(doc: HydratedDocument<PetFollow>) {
    if (!this.isPetFollow(doc)) {
      throw new Error('Invalid PetFollow document');
    }

    const [follower, following] = await Promise.all([
      this.userModel.findById(doc.follower),
      this.petModel.findById(doc.following),
    ]);

    if (!follower || !following) {
      throw new Error('Invalid PetFollow document');
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
      en: 'Follow ➕',
      ar: 'متابعة ➕',
    };
    const body = {
      en: `@author started following your pet`,
      ar: `@author بدأ بمتابعة حيوانك الأليف`,
    };

    const notificationExists = await this.notificationsHelperService.validateNotificationExists({
      deepLink,
      notificationType: UserNotificationTypeEnum.PET_FOLLOW,
      receiverUserId: receiverId.toString(),
    });

    if (notificationExists) return;

    const notification: UserNotificationDto = {
      title,
      body,
      receiverUserId: receiverId.toString(),
      deepLink,
      dynamicLink: follower.dynamicLink,
      notificationType: UserNotificationTypeEnum.PET_FOLLOW,
      imageMedia: following.profilePictureMedia,
    };

    await this.notificationsHelperService.sendUserNotificationToNotificationService(notification);
  }

  private isPetFollow(doc: HydratedDocument<PetFollow>): doc is HydratedDocument<PetFollow> {
    return !!(doc?._id && doc?.follower && doc?.following);
  }
}
