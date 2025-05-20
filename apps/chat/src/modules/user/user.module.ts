import { Module } from '@nestjs/common';
import { SharedModule } from '@chat/shared-module/shared.module';
import { AppConfig, AwsS3Module } from '@instapets-backend/common';
import { AuthService } from '@chat/user-chat/services/auth.service';
import { ChatGateway } from './chat/gateways/chat-gateway.service';
import { ChatService as WsChatService } from './chat/services/chat.service';
import { ChatRoomsController } from './controllers/chat-rooms/chat-rooms.controller';
import { ChatRoomsService } from './controllers/chat-rooms/chat-rooms.service';
import { ChatController } from './controllers/chat/chat.controller';
import { ChatService as HttpChatService } from './controllers/chat/chat.service';
import { DirectMessagesController } from './controllers/direct-messages/direct-messages.controller';
import { DirectMessagesService } from './controllers/direct-messages/direct-messages.service';
import { GroupsController } from './controllers/groups/groups.controller';
import { GroupsService } from './controllers/groups/groups.service';
import { UserChatRoomValidationService } from './shared/services/user-chat-room-validation.service';
import { UserFollowValidationService } from './shared/services/user-follow-validation.service';
import { UserChatRoomHelperService } from './shared/services/user-chat-room-helper.service';
import { ChatRequestEventListener } from './event-listeners/chat-request.listener';

@Module({
  imports: [SharedModule],
  controllers: [ChatController, GroupsController, DirectMessagesController, ChatRoomsController],
  providers: [
    ChatGateway,
    WsChatService,
    AuthService,
    HttpChatService,
    GroupsService,
    DirectMessagesService,
    ChatRoomsService,
    UserFollowValidationService,
    UserChatRoomValidationService,
    UserChatRoomHelperService,
    ChatRequestEventListener,
  ],
})
export class UserModule {}
