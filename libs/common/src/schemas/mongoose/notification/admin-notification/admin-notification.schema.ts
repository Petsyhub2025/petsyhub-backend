import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { Connection, Schema } from 'mongoose';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { AdminNotificationTypeEnum } from './admin-notification.enum';
import {
  AdminNotification,
  IAdminNotificationInstanceMethods,
  IAdminNotificationModel,
} from './admin-notification.type';
import { MediaSchema } from '@common/schemas/mongoose/common/media';

const AdminNotificationSchema = new Schema<
  AdminNotification,
  IAdminNotificationModel,
  IAdminNotificationInstanceMethods
>(
  {
    title: {
      type: String,
      maxlength: 1000,
      required: true,
    },

    body: {
      type: String,
      maxlength: 1000,
      required: true,
    },

    deepLink: {
      type: String,
      required: true,
    },

    imageMedia: {
      type: MediaSchema,
      required: false,
    },

    notificationType: {
      type: String,
      enum: AdminNotificationTypeEnum,
      required: true,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function adminNotificationSchemaFactory(connection: Connection) {
  AdminNotificationSchema.index({ createdAt: 1 });
  AdminNotificationSchema.index({ notificationType: 1 });

  AdminNotificationSchema.pre('validate', async function () {
    await validateSchema(this, AdminNotification);
  });

  const adminNotificationModel = connection.model(ModelNames.ADMIN_NOTIFICATION, AdminNotificationSchema);

  return adminNotificationModel;
}
