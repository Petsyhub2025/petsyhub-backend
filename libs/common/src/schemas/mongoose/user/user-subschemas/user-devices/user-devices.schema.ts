import { versionSubSchema } from '@common/schemas/mongoose/marketing/user-segment/user-segment-subschemas/user-device/version';
import { UserFCMTokenPlatformEnum } from '@common/schemas/mongoose/user/user-fcm-token';
import { Schema } from 'mongoose';
import { UserDevicesSubSchemaType } from './user-devices.type';

export const UserDevicesSubSchema = new Schema<UserDevicesSubSchemaType>(
  {
    platform: {
      type: String,
      enum: UserFCMTokenPlatformEnum,
      required: true,
    },

    installedVersion: {
      type: versionSubSchema,
      required: true,
    },
  },
  {
    _id: false,
    timestamps: false,
  },
);
