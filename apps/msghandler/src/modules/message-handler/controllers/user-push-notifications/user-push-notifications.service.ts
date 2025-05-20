import { Inject, Injectable } from '@nestjs/common';
import { ProcessUserPushNotificationDto } from './dto/process-user-push-notification.dto';
import { ModelNames, RabbitExchanges, RabbitRoutingKeys } from '@common/constants';
import {
  IUserModel,
  IUserSegmentModel,
  IUserPushNotificationModel,
  UserSegmentHelperService,
  User,
  UserFCMToken,
  IUserFCMTokenModel,
  UserSettingsLanguageEnum,
  UserSettingsSubSchemaType,
  UserPushNotificationMulticastNotificationDto,
  UserNotificationTypeEnum,
  IDynamicLinkModel,
  UserPushNotification,
  IMarketingUserPushNotificationMulticastEvent,
  CustomLoggerService,
  ISendUserTopicNotificationEvent,
  UserFcmTopicsEnum,
  MarketingUserNotification,
  UserPushNotificationStatusEnum,
  AwsSchedulerService,
  AppConfig,
} from '@instapets-backend/common';
import { Model, PipelineStage, Types } from 'mongoose';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { catchError, from, interval, lastValueFrom, of, take } from 'rxjs';

@Injectable()
export class UserPushNotificationsService {
  constructor(
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.USER_FCM_TOKEN) private userFCMTokenModel: IUserFCMTokenModel,
    @Inject(ModelNames.USER_SEGMENT) private userSegmentModel: IUserSegmentModel,
    @Inject(ModelNames.USER_PUSH_NOTIFICATION) private userPushNotificationModel: IUserPushNotificationModel,
    @Inject(ModelNames.DYNAMIC_LINK) private dynamicLinkModel: IDynamicLinkModel,
    private readonly userSegmentHelperService: UserSegmentHelperService,
    private readonly amqpConnection: AmqpConnection,
    private readonly logger: CustomLoggerService,
    private readonly appConfig: AppConfig,
    private readonly awsSchedulerService: AwsSchedulerService,
  ) {}

  async processUserPushNotification({ userPushNotificationId }: ProcessUserPushNotificationDto) {
    const userPushNotification = await this.userPushNotificationModel.findById(userPushNotificationId);

    if (!userPushNotification) {
      throw new Error('User push notification not found');
    }

    const scheduleName = `user-push-notification-${this.appConfig.NODE_ENV}-${userPushNotification._id.toString()}`;

    if (userPushNotification.includeAllUsers) {
      await this.handleMassSend(userPushNotification);
      userPushNotification.status = UserPushNotificationStatusEnum.SENT;
      await userPushNotification.save();
      await this.awsSchedulerService.deleteSchedule({
        Name: scheduleName,
      });
      return;
    }

    const userSegments = await this.userSegmentModel.find({ _id: { $in: userPushNotification.userSegments } }).lean();

    if (!userSegments.length) {
      throw new Error('User push notification has no user segments');
    }

    const allSegmentFilters = userSegments.map((userSegment) =>
      this.userSegmentHelperService.getUserSegmentQueryFilters(userSegment),
    );

    await this.paginateAggregate(
      this.userModel,
      {
        $match: {
          $or: allSegmentFilters,
        },
      },
      [
        {
          $project: {
            _id: 1,
          },
        },
      ],
      500,
      async (docs) => {
        return this.handlePaginatedUsers(docs, userPushNotification);
      },
    );

    // After a successful sending, get the count of users that were sent the notification

    const usersCount = await this.userModel.countDocuments({
      $or: allSegmentFilters,
    });

    userPushNotification.set({
      usersCount,
      status: UserPushNotificationStatusEnum.SENT,
    });
    await userPushNotification.save();
    await this.awsSchedulerService.deleteSchedule({
      Name: scheduleName,
    });
  }

  private async handleMassSend(userPushNotification: UserPushNotification) {
    const { dynamicLink, deepLink } = await this.dynamicLinkModel.findById(userPushNotification.dynamicLinkId).lean();

    const enPayload: ISendUserTopicNotificationEvent = {
      topic: UserFcmTopicsEnum.MARKETING_EN,
      notificationType: UserNotificationTypeEnum.MARKETING,
      dynamicLink,
      body: userPushNotification.body.en,
      title: userPushNotification.title.en,
      imageMedia: userPushNotification.media,
      deepLink,
    };

    const arPayload: ISendUserTopicNotificationEvent = {
      topic: UserFcmTopicsEnum.MARKETING_AR,
      notificationType: UserNotificationTypeEnum.MARKETING,
      dynamicLink,
      body: userPushNotification.body.ar,
      title: userPushNotification.title.ar,
      imageMedia: userPushNotification.media,
      deepLink,
    };

    await Promise.all([
      this.amqpConnection.publish<ISendUserTopicNotificationEvent>(
        RabbitExchanges.SERVICE,
        RabbitRoutingKeys.NOTIFICATION_EVENTS_USER_SEND_TOPIC_NOTIFICATION,
        enPayload,
      ),
      this.amqpConnection.publish<ISendUserTopicNotificationEvent>(
        RabbitExchanges.SERVICE,
        RabbitRoutingKeys.NOTIFICATION_EVENTS_USER_SEND_TOPIC_NOTIFICATION,
        arPayload,
      ),
    ]);
  }

  private async handlePaginatedUsers(docs: Hydrate<User>[], userPushNotification: UserPushNotification) {
    const userIds = docs.map((doc) => doc._id);

    await this.paginateAggregate<UserFCMToken & { user: { _id: Types.ObjectId; settings: UserSettingsSubSchemaType } }>(
      this.userFCMTokenModel as any, // Casting as any due to aggregation lookup type mismatch
      {
        $match: {
          user: {
            $in: userIds.map((userId) => new Types.ObjectId(userId)),
          },
        },
      },
      [
        {
          $lookup: {
            from: 'users',
            let: { userId: '$user' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', '$$userId'],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  settings: 1,
                },
              },
            ],
            as: 'user',
          },
        },
        {
          $unwind: {
            path: '$user',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $project: {
            _id: 0,
            user: 1,
            fcmToken: 1,
          },
        },
      ],
      500,
      async (docs) => {
        return this.handlePaginatedUserFCMTokens(docs, userPushNotification);
      },
    );

    await lastValueFrom(interval(15000).pipe(take(1))); // Wait 15 seconds before sending next batch to avoid rate limit
  }

  private async handlePaginatedUserFCMTokens(
    docs: Hydrate<UserFCMToken & { user: { _id: Types.ObjectId; settings: UserSettingsSubSchemaType } }>[],
    userPushNotification: UserPushNotification,
  ) {
    const { dynamicLink, deepLink } = await this.dynamicLinkModel.findById(userPushNotification.dynamicLinkId).lean();
    const userIds = new Set(docs.map((doc) => doc.user._id.toString()));
    const docsByLanguage = docs.reduce<{ en: typeof docs; ar: typeof docs }>(
      (acc, doc) => {
        switch (doc.user.settings.language) {
          case UserSettingsLanguageEnum.EN:
            acc.en.push(doc);
            break;
          case UserSettingsLanguageEnum.AR:
            acc.ar.push(doc);
            break;
          default:
            break;
        }

        return acc;
      },
      { en: [], ar: [] },
    );

    const userNotification: MarketingUserNotification = {
      body: userPushNotification.body,
      title: userPushNotification.title,
      deepLink,
      imageMedia: userPushNotification.media,
      notificationType: UserNotificationTypeEnum.MARKETING,
    };

    const enMessage: UserPushNotificationMulticastNotificationDto = {
      fcmTokens: docsByLanguage.en.map((doc) => doc.fcmToken),
      notificationType: UserNotificationTypeEnum.MARKETING,
      dynamicLink,
      body: userPushNotification.body[UserSettingsLanguageEnum.EN],
      title: userPushNotification.title[UserSettingsLanguageEnum.EN],
      deepLink,
      imageMedia: userPushNotification.media,
    };

    const arMessage: UserPushNotificationMulticastNotificationDto = {
      fcmTokens: docsByLanguage.ar.map((doc) => doc.fcmToken),
      notificationType: UserNotificationTypeEnum.MARKETING,
      dynamicLink,
      body: userPushNotification.body[UserSettingsLanguageEnum.AR],
      title: userPushNotification.title[UserSettingsLanguageEnum.AR],
      deepLink,
      imageMedia: userPushNotification.media,
    };

    const payload: IMarketingUserPushNotificationMulticastEvent = {
      userIds: Array.from(userIds),
      fcmMessages: [enMessage, arMessage],
      userNotification,
    };

    await this.amqpConnection.publish<IMarketingUserPushNotificationMulticastEvent>(
      RabbitExchanges.SERVICE,
      RabbitRoutingKeys.NOTIFICATION_EVENTS_USER_SEND_MARKETING_USER_PUSH_NOTIFICATION,
      payload,
    );
  }

  private async paginateAggregate<T>(
    model: Model<T>,
    matchStage: PipelineStage.Match,
    pipeline: PipelineStage[],
    limit: number,
    fn: (docs: Hydrate<T>[]) => Promise<void>,
  ): Promise<void> {
    let page = 1;
    while (true) {
      const docs = (await model.aggregate([
        {
          ...matchStage,
        },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        ...pipeline,
      ])) as Hydrate<T>[];

      if (!docs.length) {
        break;
      }

      await lastValueFrom(
        from(fn(docs)).pipe(
          catchError((err) => {
            this.logger.error(`Error processing paginated aggregate: ${err?.message}`, {
              err,
              model: model.modelName,
              matchStage,
              pipeline,
              limit,
              page,
            });
            return of(null);
          }),
        ),
      );

      page++;
    }
  }
}
