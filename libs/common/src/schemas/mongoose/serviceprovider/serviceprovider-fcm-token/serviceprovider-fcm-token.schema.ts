import { ModelNames } from '@common/constants';
import { Connection, Schema } from 'mongoose';
import {
  IServiceProviderFCMTokenInstanceMethods,
  IServiceProviderFCMTokenModel,
  ServiceProviderFCMToken,
} from './serviceprovider-fcm-token.type';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';

const ServiceProviderFCMTokenSchema = new Schema<
  ServiceProviderFCMToken,
  IServiceProviderFCMTokenModel,
  IServiceProviderFCMTokenInstanceMethods
>(
  {
    serviceProvider: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.SERVICE_PROVIDER,
      required: true,
    },

    fcmToken: {
      type: String,
      required: true,
    },

    ...BaseSchema,
  },
  { timestamps: true },
);

export function serviceProviderFCMTokenSchemaFactory(connection: Connection) {
  ServiceProviderFCMTokenSchema.index({ serviceProvider: 1 });
  ServiceProviderFCMTokenSchema.index({ fcmToken: 1 }, { unique: true });
  ServiceProviderFCMTokenSchema.index({ serviceProvider: 1, fcmToken: 1 });

  const serviceProviderFCMTokenModel = connection.model(
    ModelNames.SERVICE_PROVIDER_FCM_TOKEN,
    ServiceProviderFCMTokenSchema,
  );

  return serviceProviderFCMTokenModel;
}
