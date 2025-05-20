import { Schema } from 'mongoose';
import { PointLocation } from './point.type';

export const PointLocationSchema = new Schema<PointLocation>(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      // long, lat
      type: [Number],
      required: true,
    },
  },
  { _id: false },
);
