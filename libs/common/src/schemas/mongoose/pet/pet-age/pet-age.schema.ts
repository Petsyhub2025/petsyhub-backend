import { Schema } from 'mongoose';
import { PetAgeUnitEnum } from '../pet.enum';
import { PetAge } from './pet-age.type';

export const PetAgeSchema = new Schema<PetAge>(
  {
    amount: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },

    unit: {
      type: String,
      required: true,
      enum: PetAgeUnitEnum,
    },
  },
  {
    _id: false,
  },
);
