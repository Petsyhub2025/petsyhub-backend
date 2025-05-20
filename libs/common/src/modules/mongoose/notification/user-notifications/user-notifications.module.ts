import { ModelNames } from '@common/constants';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongooseCommonModule } from '../../common';
import { userNotificationSchemaFactory } from '@common/schemas/mongoose/notification/user-notification';

const UserNotificationMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.USER_NOTIFICATION,
  useFactory: userNotificationSchemaFactory,
  inject: [getConnectionToken()],
};

const userNotificationProviders = [UserNotificationMongooseDynamicModule];

@Module({
  imports: [MongooseCommonModule.forRoot()],
  exports: [...userNotificationProviders],
  providers: [...userNotificationProviders],
})
export class UserNotificationMongooseModule {}
