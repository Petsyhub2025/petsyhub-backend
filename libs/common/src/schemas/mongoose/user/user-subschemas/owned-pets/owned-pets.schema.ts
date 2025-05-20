import { Schema } from 'mongoose';
import { OwnedPetsSubSchemaType } from './owned-pets.type';
import { ModelNames } from '@common/constants';
import { PetStatusEnum } from '@common/schemas/mongoose/pet/pet.enum';

export const OwnedPetsSubSchema = new Schema<OwnedPetsSubSchemaType>(
  {
    petId: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.PET,
      required: true,
    },

    status: {
      type: String,
      enum: PetStatusEnum,
      required: false,
    },

    type: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: ModelNames.PET_TYPE,
    },
  },
  {
    _id: false,
    timestamps: false,
  },
);
