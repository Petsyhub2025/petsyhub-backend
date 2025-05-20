import { ModelNames } from '@common/constants';
import { brandSchemaFactory } from '@common/schemas/mongoose/brand/brand.schema';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongooseCommonModule } from '@common/modules/mongoose/common';

const BrandMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.BRAND,
  inject: [getConnectionToken()],
  useFactory: brandSchemaFactory,
};

const brandProviders = [BrandMongooseDynamicModule];

@Module({
  imports: [MongooseCommonModule.forRoot()],
  providers: brandProviders,
  exports: brandProviders,
})
export class BrandMongooseModule {}
