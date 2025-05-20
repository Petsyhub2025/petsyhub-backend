import { Schema } from 'mongoose';
import { UserSegmentDeviceSubSchemaType } from './user-device.type';
import { DeviceVersionSubSchema } from './version';

export const UserSegmentDeviceSubSchema = new Schema<UserSegmentDeviceSubSchemaType>(
  {
    android: {
      type: DeviceVersionSubSchema,
      required: function (this: UserSegmentDeviceSubSchemaType) {
        return !this.ios;
      },
    },

    ios: {
      type: DeviceVersionSubSchema,
      required: function (this: UserSegmentDeviceSubSchemaType) {
        return !this.android;
      },
    },
  },
  {
    _id: false,
    timestamps: false,
  },
);
