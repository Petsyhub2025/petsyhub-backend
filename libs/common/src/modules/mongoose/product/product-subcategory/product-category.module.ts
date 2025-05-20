import { ModelNames } from '@common/constants';
import { productSubCategorySchemaFactory } from '@common/schemas/mongoose/product/product-subcategory/product-subcategory.schema';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const ProductSubCategoryMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.PRODUCT_SUBCATEGORY,
  inject: [getConnectionToken()],
  useFactory: productSubCategorySchemaFactory,
};

const productSubCategoryProviders = [ProductSubCategoryMongooseDynamicModule];

@Module({
  imports: [],
  providers: productSubCategoryProviders,
  exports: productSubCategoryProviders,
})
export class ProductSubCategoryMongooseModule {}
