import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  CommentReply,
  CommentReplyEventsEnum,
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
export class CommentReplyEventListener {
  constructor(
    private readonly errorHandler: EventListenerErrorHandlerService,
    private readonly deepLinkService: DeepLinkService,
    private readonly notificationsHelperService: NotificationsHelperService,
    @Inject(ModelNames.POST) private postModel: IPostModel,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.PET) private petModel: IPetModel,
  ) {}

  @OnEvent(CommentReplyEventsEnum.SEND_NOTIFICATION, { promisify: true })
  async handle(event: HydratedDocument<CommentReply>) {
    await this.errorHandler.eventListenerErrorHandler(
      CommentReplyEventsEnum.SEND_NOTIFICATION,
      this.sendNotification.bind(this, event),
    );
  }

  private async sendNotification(doc: HydratedDocument<CommentReply>) {
    if (!this.isCommentReply(doc)) {
      throw new Error('Invalid CommentReply document');
    }

    const [post, commentReplyAuthorUser] = await Promise.all([
      this.postModel.findById(doc.post),
      this.userModel.findById(doc.authorUser),
    ]);

    if (!post || !commentReplyAuthorUser) {
      throw new Error('Invalid CommentReply document');
    }

    const [postAuthorUser, postAuthorPet] = await Promise.all([
      this.userModel.findById(post.authorUser),
      this.petModel.findById(post.authorPet),
    ]);

    if (!postAuthorUser && !postAuthorPet) {
      throw new Error('Invalid CommentReply document');
    }

    const receiverId = postAuthorUser?._id || postAuthorPet?.user?.userId;
    const deepLink = this.deepLinkService.generateUserDeepLink({
      modelId: post._id.toString(),
      modelName: DeepLinkModelsEnum.POSTS,
      modelInteractions: [
        {
          interaction: UserDeepLinkModelInteractionsEnum.COMMENTS,
          interactionId: doc.replyOn.toString(),
        },
        {
          interaction: UserDeepLinkModelInteractionsEnum.REPLIES,
          interactionId: doc._id.toString(),
        },
      ],
      queryParams: {
        authorUser: commentReplyAuthorUser._id.toString(),
      },
    });
    const title = {
      en: 'Reply 💬',
      ar: 'رد 💬',
    };
    const body = {
      en: `@author replied to your comment.`,
      ar: `@author رد على تعليقك.`,
    };

    if (commentReplyAuthorUser._id.toString() === receiverId?.toString()) return;

    const notificationExists = await this.notificationsHelperService.validateNotificationExists({
      deepLink,
      notificationType: UserNotificationTypeEnum.COMMENT_REPLY,
      receiverUserId: receiverId.toString(),
    });

    if (notificationExists) return;

    const notification: UserNotificationDto = {
      title,
      body,
      receiverUserId: receiverId.toString(),
      deepLink,
      dynamicLink: doc.dynamicLink,
      notificationType: UserNotificationTypeEnum.COMMENT_REPLY,
    };

    await this.notificationsHelperService.sendUserNotificationToNotificationService(notification);
  }

  private isCommentReply(doc: HydratedDocument<CommentReply>): doc is HydratedDocument<CommentReply> {
    return !!(doc?._id && doc?.post && doc?.authorUser);
  }
}
