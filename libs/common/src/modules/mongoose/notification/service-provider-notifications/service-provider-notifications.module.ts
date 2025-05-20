import { ModelNames } from '@common/constants';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongooseCommonModule } from '@common/modules/mongoose/common';
import { serviceProviderNotificationSchemaFactory } from '@common/schemas/mongoose/notification/service-provider-notification';

const ServiceProviderNotificationMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.SERVICE_PROVIDER_NOTIFICATION,
  useFactory: serviceProviderNotificationSchemaFactory,
  inject: [getConnectionToken()],
};

const serviceProviderNotificationProviders = [ServiceProviderNotificationMongooseDynamicModule];

@Module({
  imports: [MongooseCommonModule.forRoot()],
  exports: [...serviceProviderNotificationProviders],
  providers: [...serviceProviderNotificationProviders],
})
export class ServiceProviderNotificationMongooseModule {}
