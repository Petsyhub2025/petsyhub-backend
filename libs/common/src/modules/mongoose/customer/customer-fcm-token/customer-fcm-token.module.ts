import { ModelNames } from '@common/constants';
import { customerFCMTokenSchemaFactory } from '@common/schemas/mongoose/customer/customer-fcm-token';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const CustomerFCMTokenMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.CUSTOMER_FCM_TOKEN,
  useFactory: customerFCMTokenSchemaFactory,
  inject: [getConnectionToken()],
};

const customerFCMTokenProviders = [CustomerFCMTokenMongooseDynamicModule];

@Module({
  exports: [...customerFCMTokenProviders],
  providers: [...customerFCMTokenProviders],
})
export class CustomerFCMTokenMongooseModule {}
