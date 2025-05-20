import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  DeepLinkModelsEnum,
  DeepLinkService,
  EventListenerErrorHandlerService,
  IPetModel,
  IUserModel,
  ModelNames,
  NotificationsHelperService,
  Post,
  PostEventsEnum,
  UserNotificationDto,
  UserNotificationTypeEnum,
} from '@instapets-backend/common';
import { HydratedDocument } from 'mongoose';

@Injectable()
export class PostTagsEventListener {
  private logger = new Logger(PostTagsEventListener.name);
  constructor(
    private readonly errorHandler: EventListenerErrorHandlerService,
    private readonly deepLinkService: DeepLinkService,
    private readonly notificationsHelperService: NotificationsHelperService,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.PET) private petModel: IPetModel,
  ) {}

  @OnEvent(PostEventsEnum.USER_TAG_NOTIFICATION, { promisify: true })
  async handleUserTagNotification(event: HydratedDocument<Post>) {
    await this.errorHandler.eventListenerErrorHandler(
      PostEventsEnum.USER_TAG_NOTIFICATION,
      this.sendUserTagNotification.bind(this, event),
    );
  }

  @OnEvent(PostEventsEnum.PET_TAG_NOTIFICATION, { promisify: true })
  async handlePetTagNotification(event: HydratedDocument<Post>) {
    await this.errorHandler.eventListenerErrorHandler(
      PostEventsEnum.PET_TAG_NOTIFICATION,
      this.sendPetTagNotification.bind(this, event),
    );
  }

  private async sendUserTagNotification(doc: HydratedDocument<Post>) {
    if (!this.isUserTagPost(doc)) {
      return;
    }

    const author = doc.authorUser ?? doc.authorPetOwnedByUser;

    if (!author) {
      throw new Error('Invalid Post document');
    }

    for (const taggedUser of doc.taggedUsers) {
      const receiverId = taggedUser;
      const deepLink = this.deepLinkService.generateUserDeepLink({
        modelId: doc._id.toString(),
        modelName: DeepLinkModelsEnum.POSTS,
        queryParams: {
          authorUser: author._id.toString(),
        },
      });
      const title = {
        en: 'Tag 🏷️',
        ar: 'شعار 🏷️',
      };
      const body = {
        en: `@author has tagged you in a post`,
        ar: `@author أشار إليك في منشور`,
      };

      if (author._id.toString() === receiverId?.toString()) return;

      const notificationExists = await this.notificationsHelperService.validateNotificationExists({
        deepLink,
        notificationType: UserNotificationTypeEnum.USER_TAG,
        receiverUserId: receiverId.toString(),
      });

      if (notificationExists) return;

      const notification: UserNotificationDto = {
        title,
        body,
        receiverUserId: receiverId.toString(),
        deepLink,
        dynamicLink: doc.dynamicLink,
        notificationType: UserNotificationTypeEnum.USER_TAG,
      };

      await this.notificationsHelperService.sendUserNotificationToNotificationService(notification);
    }
  }

  private async sendPetTagNotification(doc: HydratedDocument<Post>) {
    if (!this.isPetTagPost(doc)) {
      return;
    }

    const author = doc.authorUser ?? doc.authorPetOwnedByUser;

    if (!author) {
      throw new Error('Invalid Post document');
    }

    for (const taggedPet of doc.taggedPets) {
      const pet = await this.petModel.findById(taggedPet, { _id: 1, user: 1 });

      if (!pet) {
        continue;
      }

      const receiverId = pet?.user.userId;
      const deepLink = this.deepLinkService.generateUserDeepLink({
        modelId: doc._id.toString(),
        modelName: DeepLinkModelsEnum.POSTS,
        queryParams: {
          authorUser: author._id.toString(),
        },
      });
      const title = {
        en: 'Tag 🏷️',
        ar: 'شعار 🏷️',
      };
      const body = {
        en: `@author has tagged your pet in a post`,
        ar: `@author أشار إلى حيوانك الاليف في منشور`,
      };

      if (author._id.toString() === receiverId?.toString()) return;

      const notificationExists = await this.notificationsHelperService.validateNotificationExists({
        deepLink,
        notificationType: UserNotificationTypeEnum.PET_TAG,
        receiverUserId: receiverId.toString(),
      });

      if (notificationExists) return;

      const notification: UserNotificationDto = {
        title,
        body,
        receiverUserId: receiverId.toString(),
        deepLink,
        dynamicLink: doc.dynamicLink,
        notificationType: UserNotificationTypeEnum.PET_TAG,
      };

      await this.notificationsHelperService.sendUserNotificationToNotificationService(notification);
    }
  }

  private isUserTagPost(doc: HydratedDocument<Post>): doc is HydratedDocument<Post> {
    return !!doc?.taggedUsers?.length;
  }

  private isPetTagPost(doc: HydratedDocument<Post>): doc is HydratedDocument<Post> {
    return !!doc?.taggedPets?.length;
  }
}
