import { ModelNames } from '@common/constants';
import { FactoryProvider, Module, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getConnectionToken } from '@nestjs/mongoose';
import { UserChatRoomRelationMongooseModule } from '../user-chat-room-relation';
import { baseChatRoomSchemaFactory } from '@common/schemas/mongoose/chat/chat-room/base-chat-room';
import { GroupChatEventListener } from '@common/schemas/mongoose/chat/chat-room/group-chat-room/group-chat-event-listener';
import { groupChatRoomSchemaFactory } from '@common/schemas/mongoose/chat/chat-room/group-chat-room/group-chat-room.schema';
import { PrivateChatEventListener } from '@common/schemas/mongoose/chat/chat-room/private-chat-room/private-chat-event-listener';
import { privateChatRoomSchemaFactory } from '@common/schemas/mongoose/chat/chat-room/private-chat-room/private-chat-room.schema';

const BaseChatRoomMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.BASE_CHAT_ROOM,
  inject: [getConnectionToken()],
  useFactory: baseChatRoomSchemaFactory,
};

const PrivateChatRoomMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.PRIVATE_CHAT_ROOM,
  inject: [ModelNames.BASE_CHAT_ROOM, EventEmitter2],
  useFactory: privateChatRoomSchemaFactory,
};

const GroupChatRoomMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.GROUP_CHAT_ROOM,
  inject: [ModelNames.BASE_CHAT_ROOM, EventEmitter2],
  useFactory: groupChatRoomSchemaFactory,
};

const providers = [
  BaseChatRoomMongooseDynamicModule,
  PrivateChatRoomMongooseDynamicModule,
  GroupChatRoomMongooseDynamicModule,
  GroupChatEventListener,
  PrivateChatEventListener,
];

@Module({
  imports: [forwardRef(() => UserChatRoomRelationMongooseModule)],
  providers: providers,
  exports: providers,
})
export class ChatRoomMongooseModule {}
