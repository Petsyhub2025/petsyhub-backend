import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BasePaginationQuery,
  CustomError,
  ErrorType,
  IServiceProviderFCMTokenModel,
  IServiceProviderNotificationModel,
  ModelNames,
  ServiceProviderFCMToken,
  addPaginationStages,
} from '@instapets-backend/common';
import { PipelineStage, Types } from 'mongoose';
import { MarkNotificationReadParamsDto } from './dto/mark-notification-read.dto';
import { RegisterFCMTokenDto } from './dto/register-fcm-token.dto';
import { UnregisterFCMTokenDto } from './dto/unregister-fcm-token.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(ModelNames.SERVICE_PROVIDER_FCM_TOKEN)
    private readonly serviceProviderFCMTokenModel: IServiceProviderFCMTokenModel,
    @Inject(ModelNames.SERVICE_PROVIDER_NOTIFICATION)
    private serviceProviderNotificationModel: IServiceProviderNotificationModel,
  ) {}

  async registerFCMToken(serviceProviderId: string, { fcmToken }: RegisterFCMTokenDto) {
    const serviceProviderFcmToken: Partial<ServiceProviderFCMToken> = {
      serviceProvider: new Types.ObjectId(serviceProviderId),
      fcmToken,
    };

    await this.serviceProviderFCMTokenModel.findOneAndUpdate(
      { fcmToken },
      {
        $set: serviceProviderFcmToken,
      },
      { upsert: true },
    );
  }

  async unregisterFCMToken(serviceProviderId: string, { fcmToken }: UnregisterFCMTokenDto) {
    const serviceProviderFCMToken = await this.serviceProviderFCMTokenModel.findOne({
      serviceProvider: new Types.ObjectId(serviceProviderId),
      fcmToken,
    });

    if (!serviceProviderFCMToken) return;

    await serviceProviderFCMToken.deleteOne();
  }

  async getNotifications(serviceProviderId: string, { page, limit }: BasePaginationQuery) {
    const matchStage: PipelineStage[] = [
      {
        $match: {
          receiverServiceProvider: new Types.ObjectId(serviceProviderId),
        },
      },
    ];

    const [notifications, [{ total = 0 } = {}], [{ liveNotificationsCount = 0 } = {}]] = await Promise.all([
      this.serviceProviderNotificationModel.aggregate([
        ...matchStage,
        ...addPaginationStages({ page, limit }),
        ...([
          {
            $sort: { createdAt: -1 },
          },
        ] as PipelineStage[]),
        {
          $project: {
            title: 1,
            body: 1,
            deepLink: 1,
            isRead: 1,
            imageUrl: 1,
            notificationType: 1,
            createdAt: 1,
          },
        },
      ]),
      this.serviceProviderNotificationModel.aggregate([...matchStage]).count('total'),
      this.serviceProviderNotificationModel
        .aggregate([
          ...([
            {
              $match: {
                receiverServiceProvider: new Types.ObjectId(serviceProviderId),
                isRead: false,
              },
            },
          ] as PipelineStage[]),
        ])
        .count('liveNotificationsCount'),
    ]);

    return {
      data: notifications,
      total,
      liveNotificationsCount,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  async markNotificationRead(serviceProviderId: string, { notificationId }: MarkNotificationReadParamsDto) {
    const notification = await this.serviceProviderNotificationModel.findOne({
      _id: new Types.ObjectId(notificationId),
      receiverServiceProvider: new Types.ObjectId(serviceProviderId),
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
}
