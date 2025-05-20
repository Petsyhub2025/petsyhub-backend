import { ModelNames } from '@common/constants';
import { serviceProviderSchemaFactory } from '@common/schemas/mongoose/serviceprovider/serviceprovider.schema';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongooseCommonModule } from '@common/modules/mongoose/common';

const ServiceProviderMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.SERVICE_PROVIDER,
  inject: [getConnectionToken()],
  useFactory: serviceProviderSchemaFactory,
};

const serviceProviderProviders = [ServiceProviderMongooseDynamicModule];

@Module({
  imports: [MongooseCommonModule.forRoot()],
  providers: serviceProviderProviders,
  exports: serviceProviderProviders,
})
export class ServiceProviderMongooseModule {}
