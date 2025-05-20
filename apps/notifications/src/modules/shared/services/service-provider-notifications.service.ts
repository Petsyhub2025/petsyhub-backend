import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CustomLoggerService,
  FCMTokenPayload,
  IServiceProviderModel,
  ISendServiceProviderNotificationEvent,
  IServiceProviderFCMTokenModel,
  IServiceProviderNotificationModel,
  ModelNames,
  ServiceProviderFCMService,
  ServiceProviderNotification,
} from '@instapets-backend/common';
import { Types } from 'mongoose';

@Injectable()
export class ServiceProviderNotificationsService {
  constructor(
    @Inject(ModelNames.SERVICE_PROVIDER_NOTIFICATION)
    private serviceProviderNotificationModel: IServiceProviderNotificationModel,
    @Inject(ModelNames.SERVICE_PROVIDER_FCM_TOKEN)
    private serviceProviderFCMTokenModel: IServiceProviderFCMTokenModel,
    @Inject(ModelNames.SERVICE_PROVIDER)
    private serviceProviderModel: IServiceProviderModel,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: CustomLoggerService,
  ) {}

  async sendServiceProviderNotification(notification: ISendServiceProviderNotificationEvent) {
    const {
      body,
      data: notificationData,
      notificationType,
      deepLink,
      receiverServiceProviderId,
      title,
      imageMedia,
      priority,
      timeToLive,
    } = notification;

    const tokens = await this.getReceiverServiceProviderData(receiverServiceProviderId);

    const data = {
      ...notificationData,
      notificationType,
      deepLink,
    };

    this.eventEmitter.emit('FCM.sendServiceProviderTokenNotification', {
      body: body['en'],
      title: title['en'],
      tokens,
      data,
      imageUrl: imageMedia?.url,
      priority,
      timeToLive,
    } as FCMTokenPayload);

    const serviceProviderNotification: Partial<ServiceProviderNotification> = {
      receiverServiceProvider: new Types.ObjectId(receiverServiceProviderId),
      title,
      body,
      deepLink,
      imageUrl: imageMedia?.url,
      notificationType,
    };

    const newServiceProviderNotification = new this.serviceProviderNotificationModel(serviceProviderNotification);

    await newServiceProviderNotification.save();
  }

  private async getReceiverServiceProviderData(receiverServiceProviderId: string) {
    const receiverServiceProvider = await this.serviceProviderModel.findById(receiverServiceProviderId);

    const receiverServiceProviderFCMTokens = await this.serviceProviderFCMTokenModel.find({
      serviceProvider: receiverServiceProvider._id,
    });

    const tokens = receiverServiceProviderFCMTokens?.map((relation) => relation.fcmToken);

    return tokens;
  }
}
