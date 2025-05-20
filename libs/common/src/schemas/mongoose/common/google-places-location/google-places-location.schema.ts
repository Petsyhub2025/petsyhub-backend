import { Schema } from 'mongoose';
import { ModelNames } from '@common/constants';
import { GooglePlacesLocation } from './google-places-location.type';
import { PointLocationSchema } from '../point';
import { LocalizedTextSchema } from '../localized-text';

export const GooglePlacesLocationSubSchema = new Schema<GooglePlacesLocation>(
  {
    location: {
      type: PointLocationSchema,
      required: true,
    },

    address: {
      type: LocalizedTextSchema(),
      required: false,
    },

    country: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.COUNTRY,
      required: true,
    },

    city: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.CITY,
      required: true,
    },

    area: {
      type: LocalizedTextSchema(),
      required: false,
    },

    googlePlaceId: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
    timestamps: false,
  },
);
