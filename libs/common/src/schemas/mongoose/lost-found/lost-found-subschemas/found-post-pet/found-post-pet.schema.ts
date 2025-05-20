import { ModelNames } from '@common/constants';
import { Schema } from 'mongoose';
import { FoundPostPetSubSchemaType } from './found-post-pet.type';
import { PetGenderEnum } from '@common/schemas/mongoose/pet/pet.enum';

export const FoundPostPetSubSchema = new Schema<FoundPostPetSubSchemaType>(
  {
    breed: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.PET_BREED,
      required: false,
    },

    type: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.PET_TYPE,
      required: true,
    },

    gender: {
      type: String,
      enum: PetGenderEnum,
      required: false,
    },

    height: {
      type: Number,
      min: 1,
      max: 200,
      required: false,
    },

    weight: {
      type: Number,
      min: 1,
      max: 500,
      required: false,
    },
  },
  {
    _id: false,
    timestamps: false,
  },
);
