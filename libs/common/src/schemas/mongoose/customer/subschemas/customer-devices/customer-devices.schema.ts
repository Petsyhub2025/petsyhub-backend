import { versionSubSchema } from '@common/schemas/mongoose/marketing/user-segment/user-segment-subschemas/user-device/version';
import { Schema } from 'mongoose';
import { CustomerDevicesSubSchemaType } from './customer-devices.type';
import { CustomerFCMTokenPlatformEnum } from '@common/schemas/mongoose/customer/customer-fcm-token';

export const CustomerDevicesSubSchema = new Schema<CustomerDevicesSubSchemaType>(
  {
    platform: {
      type: String,
      enum: CustomerFCMTokenPlatformEnum,
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
