import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { Connection, Schema } from 'mongoose';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { ServiceProviderNotificationTypeEnum } from './service-provider-notification.enum';
import {
  ServiceProviderNotification,
  IServiceProviderNotificationInstanceMethods,
  IServiceProviderNotificationModel,
} from './service-provider-notification.type';
import { LocalizedTextSchema } from '@common/schemas/mongoose/common/localized-text';

const ServiceProviderNotificationSchema = new Schema<
  ServiceProviderNotification,
  IServiceProviderNotificationModel,
  IServiceProviderNotificationInstanceMethods
>(
  {
    receiverServiceProvider: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.SERVICE_PROVIDER,
      required: true,
    },

    title: {
      type: LocalizedTextSchema({ maxlength: 1000 }),
      required: true,
    },

    body: {
      type: LocalizedTextSchema({ maxlength: 1000 }),
      required: true,
    },

    deepLink: {
      type: String,
      required: true,
    },

    isRead: {
      type: Boolean,
      required: false,
      default: false,
    },

    imageUrl: {
      type: String,
      required: false,
    },

    notificationType: {
      type: String,
      enum: ServiceProviderNotificationTypeEnum,
      required: true,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function serviceProviderNotificationSchemaFactory(connection: Connection) {
  ServiceProviderNotificationSchema.index({ receiverServiceProvider: 1 });
  ServiceProviderNotificationSchema.index({ createdAt: 1 });
  ServiceProviderNotificationSchema.index({ notificationType: 1 });
  ServiceProviderNotificationSchema.index({ receiverServiceProvider: 1, _id: 1 });
  ServiceProviderNotificationSchema.index({ receiverServiceProvider: 1, createdAt: -1 });
  ServiceProviderNotificationSchema.index({ receiverServiceProvider: 1, isRead: 1 });
  ServiceProviderNotificationSchema.index({ receiverServiceProvider: 1, isRead: 1, createdAt: -1 });
  ServiceProviderNotificationSchema.index({ receiverServiceProvider: 1, isRead: 1, _id: 1 });
  ServiceProviderNotificationSchema.index({ receiverServiceProvider: 1, notificationType: 1, deepLink: 1 });

  ServiceProviderNotificationSchema.pre('validate', async function () {
    await validateSchema(this, ServiceProviderNotification);
  });

  const serviceProviderNotificationModel = connection.model(
    ModelNames.SERVICE_PROVIDER_NOTIFICATION,
    ServiceProviderNotificationSchema,
  );

  return serviceProviderNotificationModel;
}
