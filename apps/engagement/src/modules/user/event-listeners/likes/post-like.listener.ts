import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  DeepLinkModelsEnum,
  DeepLinkService,
  EventListenerErrorHandlerService,
  IPetModel,
  IPostLikeModel,
  IPostModel,
  IUserModel,
  ModelNames,
  NotificationsHelperService,
  PostLike,
  PostLikeEventsEnum,
  UserNotificationDto,
  UserNotificationTypeEnum,
} from '@instapets-backend/common';
import { HydratedDocument } from 'mongoose';

@Injectable()
export class PostLikeEventListener {
  constructor(
    private readonly errorHandler: EventListenerErrorHandlerService,
    private readonly deepLinkService: DeepLinkService,
    private readonly notificationsHelperService: NotificationsHelperService,
    @Inject(ModelNames.POST) private postModel: IPostModel,
    @Inject(ModelNames.POST_LIKE) private postLikeModel: IPostLikeModel,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.PET) private petModel: IPetModel,
  ) {}

  @OnEvent(PostLikeEventsEnum.SEND_NOTIFICATION, { promisify: true })
  async handle(event: HydratedDocument<PostLike>) {
    await this.errorHandler.eventListenerErrorHandler(
      PostLikeEventsEnum.SEND_NOTIFICATION,
      this.sendNotification.bind(this, event),
    );
  }

  private async sendNotification(doc: HydratedDocument<PostLike>) {
    if (!this.isPostLike(doc)) {
      throw new Error('Invalid PostLike document');
    }

    const [post, likeAuthorUser] = await Promise.all([
      this.postModel.findById(doc.post),
      this.userModel.findById(doc.authorUser),
    ]);

    if (!post || !likeAuthorUser) {
      throw new Error('Invalid PostLike document');
    }

    const [postAuthorUser, postAuthorPet] = await Promise.all([
      this.userModel.findById(post.authorUser),
      this.petModel.findById(post.authorPet),
    ]);

    if (!postAuthorUser && !postAuthorPet) {
      throw new Error('Invalid PostLike document');
    }

    const receiverId = postAuthorUser?._id || postAuthorPet?.user?.userId;

    const recentPostLikes = await this.postLikeModel
      .find(
        {
          post: post._id,
          authorUser: {
            $nin: [receiverId, likeAuthorUser._id],
          },
        },
        { authorUser: 1 },
      )
      .sort({
        _id: -1,
      })
      .limit(2);

    const postTotalLikes = post.totalLikes - recentPostLikes.length - 1;
    const deepLink = this.deepLinkService.generateUserDeepLink({
      modelId: post._id.toString(),
      modelName: DeepLinkModelsEnum.POSTS,
      queryParams: {
        authorUser: [likeAuthorUser._id.toString(), ...recentPostLikes.map((like) => like.authorUser.toString())],
      },
    });
    const title = {
      en: 'Like 👍',
      ar: 'إعجاب 👍',
    };
    const body = {
      en: `@author ${postTotalLikes > 0 ? `and ${postTotalLikes} others ` : ''}liked your post`,
      ar: `@author ${postTotalLikes > 0 ? `و ${postTotalLikes} اخرون اعجبوا بمنشورك` : `اعجب بمنشورك`}`,
    };

    if (likeAuthorUser._id.toString() === receiverId?.toString()) return;

    const notificationExists = await this.notificationsHelperService.validateNotificationExists({
      deepLink,
      notificationType: UserNotificationTypeEnum.POST_LIKE,
      receiverUserId: receiverId.toString(),
    });

    if (notificationExists) return;

    const notification: UserNotificationDto = {
      title,
      body,
      receiverUserId: receiverId.toString(),
      deepLink,
      dynamicLink: post.dynamicLink,
      notificationType: UserNotificationTypeEnum.POST_LIKE,
      imageMedia: post.media?.[0],
    };

    await this.notificationsHelperService.sendUserNotificationToNotificationService(notification);
  }

  private isPostLike(doc: HydratedDocument<PostLike>): doc is HydratedDocument<PostLike> {
    return !!(doc?._id && doc?.post && doc?.authorUser);
  }
}
