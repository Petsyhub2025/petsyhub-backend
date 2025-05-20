import { ModelNames } from '@common/constants';
import { pendingCustomerSchemaFactory } from '@common/schemas/mongoose/customer/pending-customer';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const PendingCustomerMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.PENDING_CUSTOMER,
  inject: [getConnectionToken()],
  useFactory: pendingCustomerSchemaFactory,
};

const pendingCustomerProviders = [PendingCustomerMongooseDynamicModule];

@Module({
  imports: [],
  providers: pendingCustomerProviders,
  exports: pendingCustomerProviders,
})
export class PendingCustomerMongooseModule {}
