import { Schema } from 'mongoose';
import { ProductExtendedType } from './product-extended.type';
import { LocalizedTextSchema } from '@common/schemas/mongoose/common/localized-text';
import { ModelNames } from '@common/constants';
import { MediaSchema } from '@common/schemas/mongoose/common/media';
import { CountryCurrenciesEnum } from '@common/schemas/mongoose/country/country.enum';

export const ProductExtendedSchema = new Schema<ProductExtendedType>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.PRODUCT,
      required: true,
    },
    name: {
      type: LocalizedTextSchema(),
      required: true,
    },

    description: {
      type: LocalizedTextSchema(),
      required: true,
    },

    media: {
      type: [MediaSchema],
      required: true,
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.PRODUCT_CATEGORY,
      required: true,
    },

    subCategory: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.PRODUCT_SUBCATEGORY,
      required: true,
    },

    supplier: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.BRAND,
      required: true,
    },

    petTypes: {
      type: [Schema.Types.ObjectId],
      ref: ModelNames.PET_TYPE,
      required: true,
    },

    price: { type: Number, required: true, min: 0 },

    currency: {
      type: String,
      enum: CountryCurrenciesEnum,
      required: true,
    },
    quantityInStock: { type: Number, required: true, min: 0 },
    totalOrders: { type: Number, default: 0 },
  },
  {
    timestamps: false,
    _id: false,
  },
);
