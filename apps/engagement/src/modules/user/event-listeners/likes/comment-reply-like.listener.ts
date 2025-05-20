import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  CommentReplyLike,
  CommentReplyLikeEventsEnum,
  UserDeepLinkModelInteractionsEnum,
  DeepLinkModelsEnum,
  DeepLinkService,
  EventListenerErrorHandlerService,
  ICommentReplyLikeModel,
  ICommentReplyModel,
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
export class CommentReplyLikeEventListener {
  constructor(
    private readonly errorHandler: EventListenerErrorHandlerService,
    private readonly deepLinkService: DeepLinkService,
    private readonly notificationsHelperService: NotificationsHelperService,
    @Inject(ModelNames.COMMENT_REPLY) private commentReplyModel: ICommentReplyModel,
    @Inject(ModelNames.COMMENT_REPLY_LIKE) private commentReplyLikeModel: ICommentReplyLikeModel,
    @Inject(ModelNames.POST) private postModel: IPostModel,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.PET) private petModel: IPetModel,
  ) {}

  @OnEvent(CommentReplyLikeEventsEnum.SEND_NOTIFICATION, { promisify: true })
  async handle(event: HydratedDocument<CommentReplyLike>) {
    await this.errorHandler.eventListenerErrorHandler(
      CommentReplyLikeEventsEnum.SEND_NOTIFICATION,
      this.sendNotification.bind(this, event),
    );
  }

  private async sendNotification(doc: HydratedDocument<CommentReplyLike>) {
    if (!this.isCommentReplyLike(doc)) {
      throw new Error('Invalid CommentReplyLike document');
    }

    const [commentReply, likeAuthorUser] = await Promise.all([
      this.commentReplyModel.findById(doc.commentReply),
      this.userModel.findById(doc.authorUser),
    ]);

    if (!commentReply || !likeAuthorUser) {
      throw new Error('Invalid CommentReplyLike document');
    }

    const post = await this.postModel.findById(commentReply.post);

    if (!post) {
      throw new Error('Invalid CommentReplyLike document');
    }

    const commentReplyAuthorUser = await this.userModel.findById(commentReply.authorUser);

    if (!commentReplyAuthorUser) {
      throw new Error('Invalid CommentReplyLike document');
    }

    const receiverId = commentReplyAuthorUser?._id;

    const recentCommentReplyLikes = await this.commentReplyLikeModel
      .find(
        {
          commentReply: commentReply._id,
          authorUser: {
            $nin: [commentReply.authorUser, receiverId],
          },
        },
        { authorUser: 1 },
      )
      .sort({
        _id: -1,
      })
      .limit(2);

    const commentReplyTotalLikes = commentReply.totalLikes - recentCommentReplyLikes.length - 1;
    const deepLink = this.deepLinkService.generateUserDeepLink({
      modelId: post._id.toString(),
      modelName: DeepLinkModelsEnum.POSTS,
      modelInteractions: [
        {
          interaction: UserDeepLinkModelInteractionsEnum.COMMENTS,
          interactionId: commentReply.replyOn.toString(),
        },
        {
          interaction: UserDeepLinkModelInteractionsEnum.REPLIES,
          interactionId: commentReply._id.toString(),
        },
      ],
      queryParams: {
        authorUser: [
          likeAuthorUser._id.toString(),
          ...recentCommentReplyLikes.map((like) => like.authorUser.toString()),
        ],
      },
    });
    const title = {
      en: 'Like 👍',
      ar: 'إعجاب 👍',
    };
    const body = {
      en: `@author ${commentReplyTotalLikes > 0 ? `and ${commentReplyTotalLikes} others ` : ''}liked your reply`,
      ar: `@author ${commentReplyTotalLikes > 0 ? `و ${commentReplyTotalLikes} اخرون اعجبوا بردك` : `اعجب بردك`}`,
    };

    if (likeAuthorUser._id.toString() === receiverId?.toString()) return;

    const notificationExists = await this.notificationsHelperService.validateNotificationExists({
      deepLink,
      notificationType: UserNotificationTypeEnum.COMMENT_REPLY_LIKE,
      receiverUserId: receiverId.toString(),
    });

    if (notificationExists) return;

    const notification: UserNotificationDto = {
      title,
      body,
      receiverUserId: receiverId.toString(),
      deepLink,
      dynamicLink: commentReply.dynamicLink,
      notificationType: UserNotificationTypeEnum.COMMENT_REPLY_LIKE,
    };

    await this.notificationsHelperService.sendUserNotificationToNotificationService(notification);
  }

  private isCommentReplyLike(doc: HydratedDocument<CommentReplyLike>): doc is HydratedDocument<CommentReplyLike> {
    return !!(doc?._id && doc?.commentReply && doc?.authorUser);
  }
}
