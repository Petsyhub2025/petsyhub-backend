import { Schema } from 'mongoose';
import { Media } from './media.type';
import { MediaOrientationEnum, MediaTypeEnum } from './media.enum';

export const MediaSchema = new Schema<Media>(
  {
    type: {
      type: String,
      enum: MediaTypeEnum,
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    isSensitiveContent: {
      type: Boolean,
      required: false,
      default: false,
    },

    width: {
      type: Number,
      required: false,
    },

    height: {
      type: Number,
      required: false,
    },

    orientation: {
      type: String,
      enum: MediaOrientationEnum,
      required: false,
    },

    playbackUrl: {
      type: String,
      required: false,
    },
  },
  {
    _id: false,
  },
);
