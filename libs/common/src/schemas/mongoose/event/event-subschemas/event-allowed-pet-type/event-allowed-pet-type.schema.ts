import { ModelNames } from '@common/constants';
import { Schema } from 'mongoose';
import { EventAllowedPetTypeSubSchemaType } from './event-allowed-pet-type.type';

export const EventAllowedPetTypeSubSchema = new Schema<EventAllowedPetTypeSubSchemaType>(
  {
    petType: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.PET_TYPE,
      required: true,
    },

    specificPetBreeds: {
      type: [Schema.Types.ObjectId],
      ref: ModelNames.PET_BREED,
      required: false,
      default: [],
    },
  },
  {
    _id: false,
    timestamps: false,
  },
);
