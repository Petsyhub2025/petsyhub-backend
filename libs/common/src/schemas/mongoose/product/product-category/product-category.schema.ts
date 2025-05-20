import { Connection, Schema } from 'mongoose';
import { ProductCategory, IProductCategoryInstanceMethods, IProductCategoryModel } from './product-category.type';
import { LocalizedTextSchema } from '@common/schemas/mongoose/common/localized-text';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { MediaSchema } from '@common/schemas/mongoose/common/media';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { ModelNames } from '@common/constants';

const ProductCategorySchema = new Schema<ProductCategory, IProductCategoryModel, IProductCategoryInstanceMethods>(
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

    iconMedia: {
      type: MediaSchema,
      required: true,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function productCategorySchemaFactory(connection: Connection) {
  ProductCategorySchema.index({ 'name.en': 1 }, { unique: true });
  ProductCategorySchema.index({ 'name.ar': 1 }, { unique: true });

  ProductCategorySchema.pre('validate', async function () {
    await validateSchema(this, ProductCategory);
  });

  const productCategoryModel = connection.model(ModelNames.PRODUCT_CATEGORY, ProductCategorySchema);

  return productCategoryModel;
}
