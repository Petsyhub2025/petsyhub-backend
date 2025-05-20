import { ModelNames } from '@common/constants';
import { orderSchemaFactory } from '@common/schemas/mongoose/order/order.schema';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const OrderMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.ORDER,
  inject: [getConnectionToken()],
  useFactory: orderSchemaFactory,
};

const orderProviders = [OrderMongooseDynamicModule];

@Module({
  imports: [],
  providers: orderProviders,
  exports: orderProviders,
})
export class OrderMongooseModule {}
