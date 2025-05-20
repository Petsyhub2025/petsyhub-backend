import { Inject, Injectable, InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import {
  AdminFCMService,
  AdminFCMToken,
  AdminFcmTopicsEnum,
  AdminNotificationTypeEnum,
  AdminPermissions,
  AdminResourcesEnum,
  AdminUpdateSubscriptionsEnum,
  AdminUpdateSubscriptionsSubSchemaType,
  BasePaginationQuery,
  CustomError,
  CustomLoggerService,
  ErrorType,
  IAdminFCMTokenModel,
  IAdminModel,
  IAdminNotificationModel,
  IBaseAppointmentModel,
  ModelNames,
  addPaginationStages,
  adminPermissionToFcmTopicMapper,
  adminPermissionToNotificationTypeMapper,
  adminSubscriptionToPermissionMapper,
} from '@instapets-backend/common';
import { PipelineStage, Types } from 'mongoose';
import { catchError, concatMap, from, lastValueFrom, mergeMap, of } from 'rxjs';
import { RegisterFCMTokenDto } from './dto/register-fcm-token.dto';
import { UnregisterFCMTokenDto } from './dto/unregister-fcm-token.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(ModelNames.ADMIN) private adminModel: IAdminModel,
    @Inject(ModelNames.ADMIN_FCM_TOKEN) private adminFCMTokenModel: IAdminFCMTokenModel,
    @Inject(ModelNames.ADMIN_NOTIFICATION) private adminNotificationModel: IAdminNotificationModel,
    @Inject(ModelNames.BASE_APPOINTMENT) private appointmentModel: IBaseAppointmentModel,
    private readonly adminFCMService: AdminFCMService,
    private readonly logger: CustomLoggerService,
  ) {}

  async getNotifications(adminId: string, { page, limit }: BasePaginationQuery) {
    const admin = await this.adminModel.findById(adminId, { settings: 1, permissions: 1 }).lean();

    const { updateSubscriptions } = admin?.settings || {};
    const adminAllowedNotificationTypes = this.getAdminSubscribedAndAllowedNotificationTypes(
      admin?.permissions,
      updateSubscriptions,
    );

    const prePaginationPipeline: PipelineStage[] = [
      {
        $match: {
          notificationType: { $in: adminAllowedNotificationTypes },
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ];

    const postPaginationPipeline: PipelineStage[] = [
      {
        $project: {
          _id: 1,
          createdAt: 1,
          notificationType: 1,
          body: 1,
          title: 1,
          deepLink: 1,
          imageMedia: 1,
        },
      },
    ];

    const [notifications, [{ total = 0 } = {}]] = await Promise.all([
      this.adminNotificationModel.aggregate([
        ...prePaginationPipeline,
        ...addPaginationStages({ page, limit }),
        ...postPaginationPipeline,
      ]),
      this.adminNotificationModel.aggregate([
        ...prePaginationPipeline,
        {
          $count: 'total',
        },
      ]),
    ]);

    return {
      data: notifications,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  async registerFCMToken(adminId: string, { fcmToken }: RegisterFCMTokenDto) {
    // Validate FCM token using a dry run send
    try {
      const messageId = await this.adminFCMService.send(
        {
          tokens: [fcmToken],
          body: 'Dry run',
          title: 'Dry run',
        },
        true,
      );

      if (!messageId) {
        throw new Error('No message id returned from dry run');
      }
    } catch (error) {
      this.logger.error('Failed to register FCM token, Validation Failed.', { error, fcmToken, adminId });
      throw new UnprocessableEntityException(
        new CustomError({
          localizedMessage: {
            en: 'Invalid FCM token',
            ar: 'رمز FCM غير صالح',
          },
          event: 'INVALID_FCM_TOKEN',
          errorType: ErrorType.INVALID,
        }),
      );
    }

    const admin = await this.adminModel.findById(adminId, { settings: 1, permissions: 1 }).lean();
    const tokenExists = await this.adminFCMTokenModel.exists({ fcmToken });

    const { updateSubscriptions } = admin?.settings || {};
    const adminSubscribedFcmTopics = this.getAdminSubscribedFcmTopics(updateSubscriptions, admin?.permissions);

    const adminFCMToken: Partial<AdminFCMToken> = {
      admin: new Types.ObjectId(adminId),
      fcmToken,
    };

    await this.adminFCMTokenModel.findOneAndUpdate(
      { fcmToken },
      {
        $set: adminFCMToken,
        $addToSet: {
          topics: {
            $each: adminSubscribedFcmTopics,
          },
        },
      },
      { upsert: true },
    );

    if (!adminSubscribedFcmTopics?.length || tokenExists) return;

    await lastValueFrom(
      from(adminSubscribedFcmTopics).pipe(
        mergeMap((topic) =>
          from(this.adminFCMService.subscribeToTopic(fcmToken, topic)).pipe(
            catchError((error) => {
              this.logger.error('Failed to subscribe admin to topic', { error, fcmToken, adminId, topic });
              return of(null);
            }),
          ),
        ),
      ),
    );
  }

  async unregisterFCMToken(adminId: string, { fcmToken }: UnregisterFCMTokenDto) {
    const adminFCMToken = await this.adminFCMTokenModel.findOne({
      admin: new Types.ObjectId(adminId),
      fcmToken,
    });

    if (!adminFCMToken) return;

    await lastValueFrom(
      from(adminFCMToken.topics).pipe(
        concatMap((topic) =>
          from(this.adminFCMService.unsubscribeFromTopic(fcmToken, topic)).pipe(
            catchError((error) => {
              this.logger.error('Failed to unsubscribe admin from topic', { error, fcmToken, adminId, topic });
              throw new InternalServerErrorException(
                new CustomError({
                  localizedMessage: {
                    en: 'Failed to unregister FCM token',
                    ar: 'فشل إلغاء تسجيل رمز FCM',
                  },
                  event: 'FAILED_TO_UNREGISTER_FCM_TOKEN',
                  errorType: ErrorType.BACKEND_CODE,
                }),
              );
            }),
          ),
        ),
      ),
    );

    await adminFCMToken.deleteOne();
  }

  private getAdminSubscribedAndAllowedNotificationTypes(
    permissions: AdminPermissions,
    subscriptions: AdminUpdateSubscriptionsSubSchemaType,
  ) {
    const subscribedUpdatesToResources = this.mapSubscribedUpdatesToResources(subscriptions);

    const notificationTypes: AdminNotificationTypeEnum[] = Object.entries(permissions ?? {})
      .filter(
        ([resource, permissions]) =>
          permissions?.read && subscribedUpdatesToResources.has(resource as AdminResourcesEnum),
      )
      .map(([resource]) => adminPermissionToNotificationTypeMapper(resource as AdminResourcesEnum));

    return notificationTypes;
  }

  private getAdminSubscribedFcmTopics(
    subscriptions: AdminUpdateSubscriptionsSubSchemaType,
    permissions: AdminPermissions,
  ) {
    const subscribedUpdatesToResources = this.mapSubscribedUpdatesToResources(subscriptions);

    const fcmTopics: AdminFcmTopicsEnum[] = Object.entries(permissions ?? {})
      .filter(
        ([resource, permissions]) =>
          permissions?.read && subscribedUpdatesToResources.has(resource as AdminResourcesEnum),
      )
      .map(([resource]) => adminPermissionToFcmTopicMapper(resource as AdminResourcesEnum));

    return fcmTopics;
  }

  private mapSubscribedUpdatesToResources(
    subscriptions: AdminUpdateSubscriptionsSubSchemaType,
  ): Set<AdminResourcesEnum> {
    const subscribedUpdatesToResources: Set<AdminResourcesEnum> = new Set();

    Object.entries(subscriptions ?? {}).forEach(([subscription, isSubscribed]) => {
      if (!isSubscribed) return;
      const notificationType = adminSubscriptionToPermissionMapper(subscription as AdminUpdateSubscriptionsEnum);

      if (notificationType) subscribedUpdatesToResources.add(notificationType);
    });

    return subscribedUpdatesToResources;
  }
}
