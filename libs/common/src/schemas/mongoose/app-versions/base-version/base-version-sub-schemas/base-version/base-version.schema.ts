import { Schema } from 'mongoose';
import { BaseVersionSubSchemaType, VersionSubSchemaType } from './base-version.type';

const versionSubSchema = new Schema<VersionSubSchemaType>(
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

export const BaseVersionSubSchema = new Schema<BaseVersionSubSchemaType>(
  {
    min: {
      type: versionSubSchema,
      required: true,
    },

    max: {
      type: versionSubSchema,
      required: true,
    },
  },
  {
    _id: false,
    timestamps: false,
  },
);
