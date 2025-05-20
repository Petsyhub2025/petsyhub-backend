import { ModelNames } from '@common/constants';
import { HydratedDocument, Schema } from 'mongoose';
import { PetUser } from './pet-user.type';

export const PetUserSchema = new Schema<PetUser>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: ModelNames.USER,
    },

    country: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.COUNTRY,
      required: false,
    },

    city: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.CITY,
      required: function (this: HydratedDocument<PetUser>) {
        return !!this.country;
      },
    },

    area: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.AREA,
      required: false,
    },
  },
  {
    timestamps: false,
    _id: false,
  },
);
