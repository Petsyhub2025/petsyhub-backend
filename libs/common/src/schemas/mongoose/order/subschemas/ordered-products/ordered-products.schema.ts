import { Schema } from 'mongoose';
import { OrderedProductsSubSchemaType } from './ordered-products.type';
import { ModelNames } from '@common/constants';

export const OrderedProductsSubSchema = new Schema<OrderedProductsSubSchemaType>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.PRODUCT,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    orderedPrice: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
    timestamps: false,
  },
);
