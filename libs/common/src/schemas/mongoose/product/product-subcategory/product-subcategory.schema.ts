import { Connection, Schema } from 'mongoose';
import {
  ProductSubCategory,
  IProductSubCategoryInstanceMethods,
  IProductSubCategoryModel,
} from './product-subcategory.type';
import { LocalizedTextSchema } from '@common/schemas/mongoose/common/localized-text';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { MediaSchema } from '@common/schemas/mongoose/common/media';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { ModelNames } from '@common/constants';

const ProductSubCategorySchema = new Schema<
  ProductSubCategory,
  IProductSubCategoryModel,
  IProductSubCategoryInstanceMethods
>(
  {
    name: {
      type: LocalizedTextSchema(),
      required: true,
      unique: true,
    },

    iconMedia: {
      type: MediaSchema,
      required: true,
    },

    productCategory: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.PRODUCT_CATEGORY,
      required: true,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function productSubCategorySchemaFactory(connection: Connection) {
  ProductSubCategorySchema.index({ 'name.en': 1 }, { unique: true });
  ProductSubCategorySchema.index({ 'name.ar': 1 }, { unique: true });
  ProductSubCategorySchema.index({ productCategory: 1 });

  ProductSubCategorySchema.pre('validate', async function () {
    await validateSchema(this, ProductSubCategory);
  });

  const productSubCategoryModel = connection.model(ModelNames.PRODUCT_SUBCATEGORY, ProductSubCategorySchema);

  return productSubCategoryModel;
}
