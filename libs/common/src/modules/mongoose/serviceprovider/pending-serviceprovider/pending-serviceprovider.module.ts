import { ModelNames } from '@common/constants';
import { pendingServiceProviderSchemaFactory } from '@common/schemas/mongoose/serviceprovider/pending-serviceprovider/index';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const PendingServiceProviderMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.PENDING_SERVICE_PROVIDER,
  inject: [getConnectionToken()],
  useFactory: pendingServiceProviderSchemaFactory,
};

const pendingServiceProviderProviders = [PendingServiceProviderMongooseDynamicModule];

@Module({
  imports: [],
  providers: pendingServiceProviderProviders,
  exports: pendingServiceProviderProviders,
})
export class PendingServiceProviderMongooseModule {}
