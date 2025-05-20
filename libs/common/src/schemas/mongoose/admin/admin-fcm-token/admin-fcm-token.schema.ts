import { ModelNames } from '@common/constants';
import { Connection, Schema } from 'mongoose';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { AdminFCMToken, IAdminFCMTokenInstanceMethods, IAdminFCMTokenModel } from './admin-fcm-token.type';
import { AdminFcmTopicsEnum } from '@common/enums';

const AdminFCMTokenSchema = new Schema<AdminFCMToken, IAdminFCMTokenModel, IAdminFCMTokenInstanceMethods>(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.ADMIN,
      required: true,
    },

    fcmToken: {
      type: String,
      required: true,
    },

    topics: {
      type: [String],
      enum: AdminFcmTopicsEnum,
      required: false,
      default: [],
    },

    ...BaseSchema,
  },
  { timestamps: true },
);

export function adminFCMTokenSchemaFactory(connection: Connection) {
  AdminFCMTokenSchema.index({ admin: 1 });
  AdminFCMTokenSchema.index({ fcmToken: 1 }, { unique: true });
  AdminFCMTokenSchema.index({ admin: 1, fcmToken: 1 });

  const adminFCMTokenModel = connection.model(ModelNames.ADMIN_FCM_TOKEN, AdminFCMTokenSchema);

  return adminFCMTokenModel;
}
