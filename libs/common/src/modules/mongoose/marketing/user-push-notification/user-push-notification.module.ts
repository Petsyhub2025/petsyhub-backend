import { ModelNames } from '@common/constants';
import { MongooseCommonModule } from '@common/modules/mongoose/common';
import { userPushNotificationSchemaFactory } from '@common/schemas/mongoose/marketing/user-push-notification/user-push-notification.schema';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const userPushNotificationMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.USER_PUSH_NOTIFICATION,
  inject: [getConnectionToken()],
  useFactory: userPushNotificationSchemaFactory,
};

const providers = [userPushNotificationMongooseDynamicModule];

@Module({
  imports: [MongooseCommonModule.forRoot()],
  providers: providers,
  exports: providers,
})
export class UserPushNotificationMongooseModule {}
