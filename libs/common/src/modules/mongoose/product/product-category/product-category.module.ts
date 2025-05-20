import { ModelNames } from '@common/constants';
import { productCategorySchemaFactory } from '@common/schemas/mongoose/product/product-category/product-category.schema';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const ProductCategoryMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.PRODUCT_CATEGORY,
  inject: [getConnectionToken()],
  useFactory: productCategorySchemaFactory,
};

const productCategoryProviders = [ProductCategoryMongooseDynamicModule];

@Module({
  imports: [],
  providers: productCategoryProviders,
  exports: productCategoryProviders,
})
export class ProductCategoryMongooseModule {}
