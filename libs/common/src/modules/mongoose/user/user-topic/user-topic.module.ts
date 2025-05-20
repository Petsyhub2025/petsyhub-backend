import { ModelNames } from '@common/constants';
import { userTopicSchemaFactory } from '@common/schemas/mongoose/user/user-topic';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const UserTopicMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.USER_TOPIC,
  useFactory: userTopicSchemaFactory,
  inject: [getConnectionToken()],
};

const userTopicProviders = [UserTopicMongooseDynamicModule];

@Module({
  exports: [...userTopicProviders],
  providers: [...userTopicProviders],
})
export class UserTopicMongooseModule {}
