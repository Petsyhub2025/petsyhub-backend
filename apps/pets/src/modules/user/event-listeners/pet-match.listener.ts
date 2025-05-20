import {
  DeepLinkModelsEnum,
  DeepLinkService,
  EventListenerErrorHandlerService,
  IUserModel,
  ModelNames,
  NotificationsHelperService,
  PetMatch,
  PetMatchEventsEnum,
  UserNotificationDto,
  UserNotificationTypeEnum,
} from '@instapets-backend/common';
import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument } from 'mongoose';

@Injectable()
export class PetMatchEventListener {
  constructor(
    private readonly errorHandler: EventListenerErrorHandlerService,
    private readonly deepLinkService: DeepLinkService,
    private readonly notificationsHelperService: NotificationsHelperService,
    @Inject(ModelNames.USER) private userModel: IUserModel,
  ) {}

  @OnEvent(PetMatchEventsEnum.SEND_ACCEPTED_NOTIFICATION, { promisify: true })
  async handleAccepted(event: HydratedDocument<PetMatch>) {
    await this.errorHandler.eventListenerErrorHandler(
      PetMatchEventsEnum.SEND_ACCEPTED_NOTIFICATION,
      this.sendAcceptedNotification.bind(this, event),
    );
  }

  @OnEvent(PetMatchEventsEnum.SEND_REQUESTED_NOTIFICATION, { promisify: true })
  async handleRequested(event: HydratedDocument<PetMatch>) {
    await this.errorHandler.eventListenerErrorHandler(
      PetMatchEventsEnum.SEND_REQUESTED_NOTIFICATION,
      this.sendRequestedNotification.bind(this, event),
    );
  }

  private async sendAcceptedNotification(doc: HydratedDocument<PetMatch>) {
    if (!this.isPetMatch(doc)) {
      throw new Error('Invalid PetMatch document');
    }

    const [requester, receiver] = await Promise.all([
      this.userModel.findById(doc.requesterUser),
      this.userModel.findById(doc.receiverUser),
    ]);

    if (!requester || !receiver) {
      throw new Error('Invalid PetMatch document');
    }

    const receiverId = requester._id;
    const deepLink = this.deepLinkService.generateUserDeepLink({
      modelId: receiver._id.toString(),
      modelName: DeepLinkModelsEnum.USERS,
      queryParams: {
        authorUser: receiver._id.toString(),
      },
    });
    const title = {
      en: 'Match Accepted 🎉',
      ar: 'تم قبول الإقتران 🎉',
    };
    const body = {
      en: `@author matched with you & you can start chatting`,
      ar: `@author قام بالإقتران معك ويمكنكم البدء بالمحادثة`,
    };

    const notificationExists = await this.notificationsHelperService.validateNotificationExists({
      deepLink,
      notificationType: UserNotificationTypeEnum.PET_MATCH_ACCEPT,
      receiverUserId: receiverId.toString(),
    });

    if (notificationExists) return;

    const notification: UserNotificationDto = {
      title,
      body,
      receiverUserId: receiverId.toString(),
      deepLink,
      dynamicLink: receiver.dynamicLink,
      notificationType: UserNotificationTypeEnum.PET_MATCH_ACCEPT,
      imageMedia: receiver.profilePictureMedia,
    };

    await this.notificationsHelperService.sendUserNotificationToNotificationService(notification);
  }

  private async sendRequestedNotification(doc: HydratedDocument<PetMatch>) {
    if (!this.isPetMatch(doc)) {
      throw new Error('Invalid PetMatch document');
    }

    const [requester, receiver] = await Promise.all([
      this.userModel.findById(doc.requesterUser),
      this.userModel.findById(doc.receiverUser),
    ]);

    if (!requester || !receiver) {
      throw new Error('Invalid PetMatch document');
    }

    const receiverId = receiver._id;
    const deepLink = this.deepLinkService.generateUserDeepLink({
      modelId: requester._id.toString(),
      modelName: DeepLinkModelsEnum.USERS,
      queryParams: {
        authorUser: requester._id.toString(),
      },
    });
    const title = {
      en: 'Match Requested 🎉',
      ar: 'تم طلب الإقتران 🎉',
    };
    const body = {
      en: `@author wants to match with you`,
      ar: `@author يريد الإقتران معك`,
    };

    const notificationExists = await this.notificationsHelperService.validateNotificationExists({
      deepLink,
      notificationType: UserNotificationTypeEnum.PET_MATCH_REQUEST,
      receiverUserId: receiverId.toString(),
    });

    if (notificationExists) return;

    const notification: UserNotificationDto = {
      title,
      body,
      receiverUserId: receiverId.toString(),
      deepLink,
      dynamicLink: requester.dynamicLink,
      notificationType: UserNotificationTypeEnum.PET_MATCH_REQUEST,
      imageMedia: requester.profilePictureMedia,
    };

    await this.notificationsHelperService.sendUserNotificationToNotificationService(notification);
  }

  private isPetMatch(doc: HydratedDocument<PetMatch>): doc is HydratedDocument<PetMatch> {
    return !!(doc?._id && doc?.requesterUser && doc?.receiverUser);
  }
}
