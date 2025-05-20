import { Schema } from 'mongoose';
import { EventPlaceLocationSubSchemaType } from './event-place-location.type';
import { GooglePlacesLocationSubSchema } from '@common/schemas/mongoose/common/google-places-location';

export const EventPlaceLocationSubSchema = new Schema<EventPlaceLocationSubSchemaType>(
  {
    locationData: {
      type: GooglePlacesLocationSubSchema,
      required: true,
    },

    extraAddressDetails: {
      type: String,
      required: false,
    },
  },
  {
    _id: false,
    timestamps: false,
  },
);
