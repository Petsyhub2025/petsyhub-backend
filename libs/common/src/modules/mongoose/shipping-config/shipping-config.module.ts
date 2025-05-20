import { ModelNames } from '@common/constants';
import { shippingConfigSchemaFactory } from '@common/schemas/mongoose/shipping-config';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const ShippingConfigMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.SHIPPING_CONFIG,
  inject: [getConnectionToken()],
  useFactory: shippingConfigSchemaFactory,
};

const shippingConfigProviders = [ShippingConfigMongooseDynamicModule];

@Module({
  imports: [],
  providers: shippingConfigProviders,
  exports: shippingConfigProviders,
})
export class ShippingConfigMongooseModule {}
