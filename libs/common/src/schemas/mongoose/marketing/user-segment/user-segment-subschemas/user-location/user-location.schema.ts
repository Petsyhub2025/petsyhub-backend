import { ModelNames } from '@common/constants';
import { Schema } from 'mongoose';
import { UserSegmentLocationSubSchemaType } from './user-location.type';

export const UserSegmentLocationSubSchema = new Schema<UserSegmentLocationSubSchemaType>(
  {
    country: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.COUNTRY,
      required: function (this: UserSegmentLocationSubSchemaType) {
        return !this.city && !this.area;
      },
    },

    city: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.CITY,
      required: function (this: UserSegmentLocationSubSchemaType) {
        return !this.country && !this.area;
      },
    },

    area: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.AREA,
      required: function (this: UserSegmentLocationSubSchemaType) {
        return !this.country && !this.city;
      },
    },
  },
  {
    _id: false,
    timestamps: false,
  },
);
