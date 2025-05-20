import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  Comment,
  CommentEventsEnum,
  UserDeepLinkModelInteractionsEnum,
  DeepLinkModelsEnum,
  DeepLinkService,
  EventListenerErrorHandlerService,
  IPetModel,
  IPostModel,
  IUserModel,
  ModelNames,
  NotificationsHelperService,
  UserNotificationDto,
  UserNotificationTypeEnum,
} from '@instapets-backend/common';
import { HydratedDocument } from 'mongoose';

@Injectable()
export class CommentEventListener {
  constructor(
    private readonly errorHandler: EventListenerErrorHandlerService,
    private readonly deepLinkService: DeepLinkService,
    private readonly notificationsHelperService: NotificationsHelperService,
    @Inject(ModelNames.POST) private postModel: IPostModel,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.PET) private petModel: IPetModel,
  ) {}

  @OnEvent(CommentEventsEnum.SEND_NOTIFICATION, { promisify: true })
  async handle(event: HydratedDocument<Comment>) {
    await this.errorHandler.eventListenerErrorHandler(
      CommentEventsEnum.SEND_NOTIFICATION,
      this.sendNotification.bind(this, event),
    );
  }

  private async sendNotification(doc: HydratedDocument<Comment>) {
    if (!this.isComment(doc)) {
      throw new Error('Invalid Comment document');
    }

    const [post, commentAuthorUser] = await Promise.all([
      this.postModel.findById(doc.post),
      this.userModel.findById(doc.authorUser),
    ]);

    if (!post || !commentAuthorUser) {
      throw new Error('Invalid Comment document');
    }

    const [postAuthorUser, postAuthorPet] = await Promise.all([
      this.userModel.findById(post.authorUser),
      this.petModel.findById(post.authorPet),
    ]);

    if (!postAuthorUser && !postAuthorPet) {
      throw new Error('Invalid Comment document');
    }

    const receiverId = postAuthorUser?._id || postAuthorPet?.user?.userId;
    const deepLink = this.deepLinkService.generateUserDeepLink({
      modelId: post._id.toString(),
      modelName: DeepLinkModelsEnum.POSTS,
      modelInteractions: [
        {
          interaction: UserDeepLinkModelInteractionsEnum.COMMENTS,
          interactionId: doc._id.toString(),
        },
      ],
      queryParams: {
        authorUser: commentAuthorUser._id.toString(),
      },
    });
    const title = {
      en: 'Comment 💬',
      ar: 'تعليق 💬',
    };
    const body = {
      en: `@author commented on your post`,
      ar: `@author علق على منشورك`,
    };

    if (commentAuthorUser._id.toString() === receiverId?.toString()) return;

    const notificationExists = await this.notificationsHelperService.validateNotificationExists({
      deepLink,
      notificationType: UserNotificationTypeEnum.POST_COMMENT,
      receiverUserId: receiverId.toString(),
    });

    if (notificationExists) return;

    const notification: UserNotificationDto = {
      title,
      body,
      receiverUserId: receiverId.toString(),
      deepLink,
      dynamicLink: doc.dynamicLink,
      notificationType: UserNotificationTypeEnum.POST_COMMENT,
      imageMedia: post.media?.[0],
    };

    await this.notificationsHelperService.sendUserNotificationToNotificationService(notification);
  }

  private isComment(doc: HydratedDocument<Comment>): doc is HydratedDocument<Comment> {
    return !!(doc?._id && doc?.post && doc?.authorUser);
  }
}
