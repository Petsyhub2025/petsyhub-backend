import { ModelNames } from '@common/constants';
import { userChatRoomRelationSchemaFactory } from '@common/schemas/mongoose/chat/user-chat-room-relation';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const UserChatRoomRelationMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.USER_CHAT_ROOM_RELATION,
  inject: [getConnectionToken()],
  useFactory: userChatRoomRelationSchemaFactory,
};

const providers = [UserChatRoomRelationMongooseDynamicModule];

@Module({
  imports: [],
  providers: providers,
  exports: providers,
})
export class UserChatRoomRelationMongooseModule {}
