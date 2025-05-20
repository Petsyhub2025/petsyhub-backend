import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  CommentLike,
  CommentLikeEventsEnum,
  UserDeepLinkModelInteractionsEnum,
  DeepLinkModelsEnum,
  DeepLinkService,
  EventListenerErrorHandlerService,
  ICommentLikeModel,
  ICommentModel,
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
export class CommentLikeEventListener {
  constructor(
    private readonly errorHandler: EventListenerErrorHandlerService,
    private readonly deepLinkService: DeepLinkService,
    private readonly notificationsHelperService: NotificationsHelperService,
    @Inject(ModelNames.COMMENT) private commentModel: ICommentModel,
    @Inject(ModelNames.COMMENT_LIKE) private commentLikeModel: ICommentLikeModel,
    @Inject(ModelNames.POST) private postModel: IPostModel,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.PET) private petModel: IPetModel,
  ) {}

  @OnEvent(CommentLikeEventsEnum.SEND_NOTIFICATION, { promisify: true })
  async handle(event: HydratedDocument<CommentLike>) {
    await this.errorHandler.eventListenerErrorHandler(
      CommentLikeEventsEnum.SEND_NOTIFICATION,
      this.sendNotification.bind(this, event),
    );
  }

  private async sendNotification(doc: HydratedDocument<CommentLike>) {
    if (!this.isCommentLike(doc)) {
      throw new Error('Invalid CommentLike document');
    }

    const [comment, likeAuthorUser] = await Promise.all([
      this.commentModel.findById(doc.comment),
      this.userModel.findById(doc.authorUser),
    ]);

    if (!comment || !likeAuthorUser) {
      throw new Error('Invalid CommentLike document');
    }

    const post = await this.postModel.findById(comment.post);

    if (!post) {
      throw new Error('Invalid CommentLike document');
    }

    const commentAuthorUser = await this.userModel.findById(comment.authorUser);

    if (!commentAuthorUser) {
      throw new Error('Invalid CommentLike document');
    }

    const receiverId = commentAuthorUser?._id;

    const recentCommentLikes = await this.commentLikeModel
      .find(
        {
          comment: comment._id,
          authorUser: {
            $nin: [comment.authorUser, receiverId],
          },
        },
        { authorUser: 1 },
      )
      .sort({
        _id: -1,
      })
      .limit(2);

    const commentTotalLikes = comment.totalLikes - recentCommentLikes.length - 1;
    const deepLink = this.deepLinkService.generateUserDeepLink({
      modelId: post._id.toString(),
      modelName: DeepLinkModelsEnum.POSTS,
      modelInteractions: [
        {
          interaction: UserDeepLinkModelInteractionsEnum.COMMENTS,
          interactionId: comment._id.toString(),
        },
      ],
      queryParams: {
        authorUser: [likeAuthorUser._id.toString(), ...recentCommentLikes.map((like) => like.authorUser.toString())],
      },
    });
    const title = {
      en: 'Like 👍',
      ar: 'إعجاب 👍',
    };
    const body = {
      en: `@author ${commentTotalLikes > 0 ? `and ${commentTotalLikes} others ` : ''}liked your comment`,
      ar: `@author ${commentTotalLikes > 0 ? `و ${commentTotalLikes} اخرون اعجبوا بتعليقك` : `اعجب بتعليقك`}`,
    };

    if (likeAuthorUser._id.toString() === receiverId?.toString()) return;

    const notificationExists = await this.notificationsHelperService.validateNotificationExists({
      deepLink,
      notificationType: UserNotificationTypeEnum.COMMENT_LIKE,
      receiverUserId: receiverId.toString(),
    });

    if (notificationExists) return;

    const notification: UserNotificationDto = {
      title,
      body,
      receiverUserId: receiverId.toString(),
      deepLink,
      dynamicLink: comment.dynamicLink,
      notificationType: UserNotificationTypeEnum.COMMENT_LIKE,
    };

    await this.notificationsHelperService.sendUserNotificationToNotificationService(notification);
  }

  private isCommentLike(doc: HydratedDocument<CommentLike>): doc is HydratedDocument<CommentLike> {
    return !!(doc?._id && doc?.comment && doc?.authorUser);
  }
}
