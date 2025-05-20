import { ModelNames } from '@common/constants';
import { userAddressSchemaFactory } from '@common/schemas/mongoose/user/user-address';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const UserAddressMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.USER_ADDRESS,
  inject: [getConnectionToken()],
  useFactory: userAddressSchemaFactory,
};

const userAddressProviders = [UserAddressMongooseDynamicModule];

@Module({
  imports: [],
  providers: userAddressProviders,
  exports: userAddressProviders,
})
export class UserAddressMongooseModule {}
