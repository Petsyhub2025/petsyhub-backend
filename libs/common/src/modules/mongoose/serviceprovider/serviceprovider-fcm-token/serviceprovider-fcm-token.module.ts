import { ModelNames } from '@common/constants';
import { serviceProviderFCMTokenSchemaFactory } from '@common/schemas/mongoose/serviceprovider/serviceprovider-fcm-token/index';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const ServiceProviderFCMTokenMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.SERVICE_PROVIDER_FCM_TOKEN,
  useFactory: serviceProviderFCMTokenSchemaFactory,
  inject: [getConnectionToken()],
};

const serviceProviderFCMTokenProviders = [ServiceProviderFCMTokenMongooseDynamicModule];

@Module({
  exports: [...serviceProviderFCMTokenProviders],
  providers: [...serviceProviderFCMTokenProviders],
})
export class ServiceProviderFCMTokenMongooseModule {}
