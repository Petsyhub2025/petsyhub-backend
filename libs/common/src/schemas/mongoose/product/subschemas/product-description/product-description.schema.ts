import { Schema } from 'mongoose';
import { ProductDescriptionSubSchemaType } from './product-description.type';
import { LocalizedTextSchema } from '@common/schemas/mongoose/common/localized-text';

export const ProductDescriptionSubSchema = new Schema<ProductDescriptionSubSchemaType>(
  {
    text: {
      type: LocalizedTextSchema(),
      required: true,
    },

    bulletPoints: {
      type: [LocalizedTextSchema()],
      required: false,
      default: [],
    },
  },
  {
    _id: false,
    timestamps: false,
  },
);
