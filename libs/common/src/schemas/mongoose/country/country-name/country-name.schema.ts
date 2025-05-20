import { Schema } from 'mongoose';
import { CountryName } from './country-name.type';
import { LocalizedTextSchema } from '@common/schemas/mongoose/common/localized-text';

export const CountryNameSchema = new Schema<CountryName>(
  {
    ...LocalizedTextSchema().obj,
    abbr: { type: String, trim: true, required: true },
  },
  {
    _id: false,
  },
);
