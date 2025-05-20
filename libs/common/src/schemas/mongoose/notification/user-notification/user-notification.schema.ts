import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { Schema, Connection } from 'mongoose';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { LocalizedTextSchema } from '@common/schemas/mongoose/common/localized-text';
import { UserNotificationTypeEnum } from './user-notification.enum';
import { UserNotification, IUserNotificationModel, IUserNotificationInstanceMethods } from './user-notification.type';
import { MediaSchema } from '@common/schemas/mongoose/common/media';

const UserNotificationSchema = new Schema<UserNotification, IUserNotificationModel, IUserNotificationInstanceMethods>(
  {
    receiverUser: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.USER,
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

    imageMedia: {
      type: MediaSchema,
      required: false,
    },

    notificationType: {
      type: String,
      enum: UserNotificationTypeEnum,
      required: true,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function userNotificationSchemaFactory(connection: Connection) {
  UserNotificationSchema.index({ receiverUser: 1 });
  UserNotificationSchema.index({ createdAt: 1 });
  UserNotificationSchema.index({ notificationType: 1 });
  UserNotificationSchema.index({ receiverUser: 1, _id: 1 });
  UserNotificationSchema.index({ receiverUser: 1, createdAt: -1 });
  UserNotificationSchema.index({ receiverUser: 1, isRead: 1 });
  UserNotificationSchema.index({ receiverUser: 1, isRead: 1, createdAt: -1 });
  UserNotificationSchema.index({ receiverUser: 1, isRead: 1, _id: 1 });
  UserNotificationSchema.index({ receiverUser: 1, notificationType: 1, deepLink: 1 });

  UserNotificationSchema.pre('validate', async function () {
    await validateSchema(this, UserNotification);
  });

  const userNotificationModel = connection.model(ModelNames.USER_NOTIFICATION, UserNotificationSchema);

  return userNotificationModel;
}
