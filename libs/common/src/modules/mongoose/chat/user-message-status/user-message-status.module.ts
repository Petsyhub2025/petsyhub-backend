import { ModelNames } from '@common/constants';
import { userMessageStatusSchemaFactory } from '@common/schemas/mongoose/chat/user-message-status';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const UserMessageStatusMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.USER_MESSAGE_STATUS,
  inject: [getConnectionToken()],
  useFactory: userMessageStatusSchemaFactory,
};

const providers = [UserMessageStatusMongooseDynamicModule];

@Module({
  imports: [],
  providers: providers,
  exports: providers,
})
export class UserMessageStatusMongooseModule {}
