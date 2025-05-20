import { ModelNames } from '@common/constants';
import { productSchemaFactory } from '@common/schemas/mongoose/product/product.schema';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongooseCommonModule } from '@common/modules/mongoose/common';

const ProductMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.PRODUCT,
  inject: [getConnectionToken()],
  useFactory: productSchemaFactory,
};

const productProviders = [ProductMongooseDynamicModule];

@Module({
  imports: [MongooseCommonModule.forRoot()],
  providers: productProviders,
  exports: productProviders,
})
export class ProductMongooseModule {}
