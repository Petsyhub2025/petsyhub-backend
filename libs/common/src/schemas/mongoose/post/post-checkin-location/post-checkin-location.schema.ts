import { Schema } from 'mongoose';
import { PostCheckInLocation } from './post-checkin-location.type';
import { ModelNames } from '@common/constants';

export const PostCheckInLocationSchema = new Schema<PostCheckInLocation>(
  {
    country: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: ModelNames.COUNTRY,
    },

    city: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: ModelNames.CITY,
    },
  },
  {
    _id: false,
  },
);
