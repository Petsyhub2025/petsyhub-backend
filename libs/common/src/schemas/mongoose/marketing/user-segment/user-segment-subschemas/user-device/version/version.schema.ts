import { Schema } from 'mongoose';
import { DeviceVersionSubSchemaType, VersionType } from './version.type';

export const versionSubSchema = new Schema<VersionType>(
  {
    major: {
      type: Number,
      required: true,
    },

    minor: {
      type: Number,
      default: 0,
    },

    patch: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
    timestamps: false,
  },
);

export const DeviceVersionSubSchema = new Schema<DeviceVersionSubSchemaType>(
  {
    min: {
      type: versionSubSchema,
      required: function (this: DeviceVersionSubSchemaType) {
        return !this.max;
      },
    },

    max: {
      type: versionSubSchema,
      required: function (this: DeviceVersionSubSchemaType) {
        return !this.min;
      },
    },
  },
  {
    _id: false,
    timestamps: false,
  },
);
