import { ModelNames } from '@common/constants';
import { userFCMTokenSchemaFactory } from '@common/schemas/mongoose/user/user-fcm-token';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const UserFCMTokenMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.USER_FCM_TOKEN,
  useFactory: userFCMTokenSchemaFactory,
  inject: [getConnectionToken()],
};

const userFCMTokenProviders = [UserFCMTokenMongooseDynamicModule];

@Module({
  exports: [...userFCMTokenProviders],
  providers: [...userFCMTokenProviders],
})
export class UserFCMTokenMongooseModule {}
