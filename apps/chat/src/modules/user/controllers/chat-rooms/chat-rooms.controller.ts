import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { globalControllerVersioning } from '@chat/shared-module/constants';
import {
  BasePaginationQuery,
  CustomResponse,
  GetMediaPreSignedUrlQueryDto,
  Persona,
  UserJwtPersona,
} from '@instapets-backend/common';
import { ChatRoomsService } from './chat-rooms.service';
import { ChatRoomIdParamDto } from './dto/chat-room-id-param.dto';
import { GetRoomMessagesQueryDto } from './dto/get-room-messages.dto';

@Controller({
  path: 'chat-rooms',
  ...globalControllerVersioning,
})
@ApiTags('user')
export class ChatRoomsController {
  constructor(private readonly chatRoomsService: ChatRoomsService) {}

  @ApiBearerAuth()
  @Get()
  async getChatRooms(@Persona() userJWT: UserJwtPersona) {
    const chatRooms = await this.chatRoomsService.getChatRooms(userJWT._id);

    return new CustomResponse().success({
      payload: { data: chatRooms },
    });
  }

  @ApiBearerAuth()
  @Get('chat-requests')
  async getPendingChatRequestUsers(@Persona() userJWT: UserJwtPersona, @Query() query: BasePaginationQuery) {
    const users = await this.chatRoomsService.getPendingChatRequestUsers(userJWT._id, query);

    return new CustomResponse().success({
      payload: users,
    });
  }

  @ApiBearerAuth()
  @Get(':chatRoomId/room-messages')
  async getRoomMessages(
    @Persona() userJWT: UserJwtPersona,
    @Param() param: ChatRoomIdParamDto,
    @Query() query: GetRoomMessagesQueryDto,
  ) {
    const messages = await this.chatRoomsService.getRoomMessages(userJWT._id, param, query);

    return new CustomResponse().success({
      payload: { data: messages },
    });
  }

  @ApiBearerAuth()
  @Post(':chatRoomId/clear-messages')
  async clearChatRoomMessages(@Persona() userJWT: UserJwtPersona, @Param() param: ChatRoomIdParamDto) {
    await this.chatRoomsService.clearChatRoomMessages(userJWT._id, param);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Post(':chatRoomId/chat-request/accept')
  async acceptChatRequest(@Persona() userJWT: UserJwtPersona, @Param() param: ChatRoomIdParamDto) {
    await this.chatRoomsService.acceptChatRequest(userJWT._id, param);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Post(':chatRoomId/chat-request/reject')
  async rejectChatRequest(@Persona() userJWT: UserJwtPersona, @Param() param: ChatRoomIdParamDto) {
    await this.chatRoomsService.rejectChatRequest(userJWT._id, param);

    return new CustomResponse().success({});
  }
}
