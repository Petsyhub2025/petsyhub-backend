import { ModelNames } from '@common/constants';
import { customerAddressSchemaFactory } from '@common/schemas/mongoose/customer/customer-address';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const CustomerAddressMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.CUSTOMER_ADDRESS,
  inject: [getConnectionToken()],
  useFactory: customerAddressSchemaFactory,
};

const customerAddressProviders = [CustomerAddressMongooseDynamicModule];

@Module({
  imports: [],
  providers: customerAddressProviders,
  exports: customerAddressProviders,
})
export class CustomerAddressMongooseModule {}
