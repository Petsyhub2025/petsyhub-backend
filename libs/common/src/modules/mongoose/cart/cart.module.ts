import { ModelNames } from '@common/constants';
import { cartSchemaFactory } from '@common/schemas/mongoose/cart';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const CartMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.CART,
  inject: [getConnectionToken()],
  useFactory: cartSchemaFactory,
};

const cartProviders = [CartMongooseDynamicModule];

@Module({
  imports: [],
  providers: cartProviders,
  exports: cartProviders,
})
export class CartMongooseModule {}
