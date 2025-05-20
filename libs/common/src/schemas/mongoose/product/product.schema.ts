import { Connection, Schema } from 'mongoose';
import { Product, IProductInstanceMethods, IProductModel } from './product.type';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { MediaSchema } from '@common/schemas/mongoose/common/media';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { ModelNames } from '@common/constants';
import { LocalizedTextSchema } from '@common/schemas/mongoose/common/localized-text';

const ProductSchema = new Schema<Product, IProductModel, IProductInstanceMethods>(
  {
    name: {
      type: LocalizedTextSchema(),
      required: true,
      unique: true,
    },

    description: {
      type: LocalizedTextSchema(),
      required: true,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
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

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function productSchemaFactory(connection: Connection) {
  ProductSchema.index({ category: 1 });
  ProductSchema.index({ subCategory: 1 });
  ProductSchema.index({ brand: 1 });
  ProductSchema.index({ petTypes: 1 });
  ProductSchema.index({ category: 1, subCategory: 1 });

  ProductSchema.pre('validate', async function () {
    await validateSchema(this, Product);
  });

  const productModel = connection.model(ModelNames.PRODUCT, ProductSchema);

  return productModel;
}
