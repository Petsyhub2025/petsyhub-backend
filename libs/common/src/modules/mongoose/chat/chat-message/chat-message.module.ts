import { ModelNames } from '@common/constants';
import { chatMessageSchemaFactory } from '@common/schemas/mongoose/chat/chat-message';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const ChatMessageMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.CHAT_MESSAGE,
  inject: [getConnectionToken()],
  useFactory: chatMessageSchemaFactory,
};

const providers = [ChatMessageMongooseDynamicModule];

@Module({
  imports: [],
  providers: providers,
  exports: providers,
})
export class ChatMessageMongooseModule {}
