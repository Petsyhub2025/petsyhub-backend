import {
  BasePaginationQuery,
  CustomError,
  CustomLoggerService,
  ErrorType,
  IUserFCMTokenModel,
  IUserModel,
  IUserNotificationModel,
  ModelNames,
  User,
  UserFCMService,
  UserFCMToken,
  UserNotification,
  UserNotificationTypeEnum,
  UserNotificationValidationDto,
  addPaginationStages,
  getIsUserFollowed,
  userLanguageToFcmTopicsMapper,
} from '@instapets-backend/common';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  getAuthorFromAuthorUsers,
  processNotificationBody,
} from '@notifications/shared-module/helpers/notification.helper';
import { HydratedDocument, PipelineStage, Types } from 'mongoose';
import { catchError, from, mergeMap, of } from 'rxjs';
import { MarkNotificationReadParamsDto } from './dto/mark-notification-read.dto';
import { RegisterUserFCMTokenDto } from './dto/register-fcm-token.dto';
import { UnregisterFCMTokenDto } from './dto/unregister-fcm-token.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.USER_FCM_TOKEN)
    private readonly userFCMTokenModel: IUserFCMTokenModel,
    @Inject(ModelNames.USER_NOTIFICATION)
    private userNotificationModel: IUserNotificationModel,
    private readonly userFCMService: UserFCMService,
    private readonly logger: CustomLoggerService,
  ) {}

  async registerFCMToken(userId: string, { fcmToken, appVersion, platform }: RegisterUserFCMTokenDto) {
    const oldUserFcmToken = await this.userFCMTokenModel.findOne({
      fcmToken,
    });

    const newUserFcmToken: Partial<UserFCMToken> = {
      user: new Types.ObjectId(userId),
      fcmToken,
      appVersion,
      platform,
    };

    const userFCMToken = oldUserFcmToken || new this.userFCMTokenModel();

    userFCMToken.set(newUserFcmToken);

    await userFCMToken.save();

    const user = await this.userModel.findById(userId, { settings: 1 }).lean();
    const { language } = user?.settings;
    const topicsToSubscribe = userLanguageToFcmTopicsMapper(language);

    if (!topicsToSubscribe?.length) return;

    from(topicsToSubscribe)
      .pipe(
        mergeMap((topic) =>
          from(this.userFCMService.subscribeToTopic(fcmToken, topic)).pipe(
            catchError((error) => {
              this.logger.error('Failed to subscribe user to topic', { error, fcmToken, userId, topic });
              return of(null);
            }),
          ),
        ),
      )
      .subscribe();
  }

  async unregisterFCMToken(userId: string, { fcmToken }: UnregisterFCMTokenDto) {
    const userFCMToken = await this.userFCMTokenModel.findOne({
      user: new Types.ObjectId(userId),
      fcmToken,
    });

    if (!userFCMToken) return;

    await userFCMToken.deleteOne();

    const user = await this.userModel.findById(userId, { settings: 1 }).lean();
    const { language } = user?.settings;
    const topicsToUnSubscribe = userLanguageToFcmTopicsMapper(language);

    if (!topicsToUnSubscribe?.length) return;

    from(topicsToUnSubscribe)
      .pipe(
        mergeMap((topic) =>
          from(this.userFCMService.unsubscribeFromTopic(fcmToken, topic)).pipe(
            catchError((error) => {
              this.logger.error('Failed to unsubscribe user from to topic', { error, fcmToken, userId, topic });
              return of(null);
            }),
          ),
        ),
      )
      .subscribe();
  }

  async getNotifications(userId: string, { page, limit }: BasePaginationQuery) {
    const excludedNotificationTypes = [
      UserNotificationTypeEnum.PET_MATCH_REQUEST,
      UserNotificationTypeEnum.PENDING_PET_FOLLOW,
      UserNotificationTypeEnum.PENDING_USER_FOLLOW,
    ];
    const prePaginationPipeline: PipelineStage[] = [
      {
        $match: {
          receiverUser: new Types.ObjectId(userId),
          notificationType: {
            $in: Object.values(UserNotificationTypeEnum).filter((value) => !excludedNotificationTypes.includes(value)),
          },
        },
      },
    ];

    const postPaginationPipeline: PipelineStage[] = [
      {
        $addFields: {
          authorUsers: {
            $regexFindAll: {
              input: '$deepLink',
              regex: /authorUser=([a-zA-z0-9]+)/,
            },
          },
        },
      },
      {
        $addFields: {
          authorUsers: {
            $reduce: {
              input: '$authorUsers',
              initialValue: [],
              in: {
                $concatArrays: [
                  '$$value',
                  [
                    {
                      $toObjectId: {
                        $arrayElemAt: ['$$this.captures', 0],
                      },
                    },
                  ],
                ],
              },
            },
          },
        },
      },
      ...this.getDeepLinkAuthorUserPipeline(userId, 0),
      ...this.getDeepLinkAuthorUserPipeline(userId, 1),
      ...this.getDeepLinkAuthorUserPipeline(userId, 2),
      {
        $addFields: {
          authorUsers: {
            $concatArrays: [
              { $ifNull: ['$authorUser_0', []] },
              { $ifNull: ['$authorUser_1', []] },
              { $ifNull: ['$authorUser_2', []] },
            ],
          },
        },
      },
      {
        $unset: ['authorUser_0', 'authorUser_1', 'authorUser_2'],
      },
      {
        $project: {
          _id: 1,
          authorUsers: 1,
          createdAt: 1,
          deepLink: 1,
          isRead: 1,
          notificationType: 1,
          title: 1,
          body: 1,
          imageMedia: 1,
        },
      },
    ];

    const [prePopulatedNotifications, total] = await Promise.all([
      this.userNotificationModel.aggregate<
        HydratedDocument<UserNotification> & {
          authorUsers: HydratedDocument<User>[];
        }
      >([
        // This isn't a hydrated document but its there for _id's sake
        ...prePaginationPipeline,
        { $sort: { _id: -1 } },
        ...addPaginationStages({ page, limit }),
        ...postPaginationPipeline,
      ]),
      this.userNotificationModel.countDocuments({
        receiverUser: new Types.ObjectId(userId),
      }),
    ]);

    const notifications = prePopulatedNotifications.map((notification) => {
      const { body, authorUsers } = notification;

      const author: string = getAuthorFromAuthorUsers(authorUsers);

      const newBody = Object.keys(body).reduce((acc, key) => {
        const value = body[key];

        acc[key] = processNotificationBody(value, author);

        return acc;
      }, {});

      return {
        ...notification,
        body: newBody,
      };
    });

    return {
      data: notifications,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async validateExistingNotification({ receiverUserId, deepLink, notificationType }: UserNotificationValidationDto) {
    const url = new URL(deepLink);

    const author = url.searchParams.get('authorUser');

    const notification = await this.userNotificationModel.findOne({
      notificationType,
      receiverUser: new Types.ObjectId(receiverUserId),
      deepLink: {
        $regex: new RegExp(`^${url.origin}${url.pathname}\\?authorUser=${author}.*`),
      },
    });

    return !!notification;
  }

  async markNotificationRead(userId: string, { notificationId }: MarkNotificationReadParamsDto) {
    const notification = await this.userNotificationModel.findOne({
      _id: new Types.ObjectId(notificationId),
      receiverUser: new Types.ObjectId(userId),
    });

    if (!notification) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Notification not found',
            ar: 'الإشعار غير موجود',
          },
          event: 'NOTIFICATION_NOT_FOUND',
          errorType: ErrorType.NOT_FOUND,
        }),
      );
    }

    await notification.updateOne({
      $set: {
        isRead: true,
      },
    });
  }

  private getDeepLinkAuthorUserPipeline(viewerId: string, index: number) {
    return [
      {
        $lookup: {
          from: 'users',
          let: {
            userId: {
              $arrayElemAt: ['$authorUsers', index],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $ifNull: ['$$userId', null] }],
                },
              },
            },
            ...getIsUserFollowed(viewerId),
            {
              $project: {
                firstName: 1,
                lastName: 1,
                profilePictureMedia: 1,
                isFollowed: 1,
                isPendingFollow: 1,
                isFollowingMe: 1,
                isUserPendingFollowOnMe: 1,
              },
            },
          ],
          as: `authorUser_${index}`,
        },
      },
    ];
  }
}
