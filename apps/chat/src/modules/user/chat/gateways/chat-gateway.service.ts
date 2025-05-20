import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  CustomLoggerService,
  CustomResponse,
  ISocketDisconnectionEvent,
  Listen,
  RabbitExchanges,
  RabbitQueues,
  RabbitRoutingKeys,
  SocketEventsEnum,
  UserJwtPersona,
  WsClassValidatorPipe,
  WsExceptionFilter,
  WsPersona,
  WsUserJwtVerifyGuard,
} from '@instapets-backend/common';
import { DeleteMessageDto } from '@chat/user-chat/dto/delete-message.dto';
import { GetParticipantDataDto } from '@chat/user-chat/dto/get-participant-data.dto';
import { MarkAsReadDto } from '@chat/user-chat/dto/mark-as-read.dto';
import { RoomIdDto } from '@chat/user-chat/dto/room-id.dto';
import { SendMessageDto } from '@chat/user-chat/dto/send-message.dto';
import { AuthService } from '@chat/user-chat/services/auth.service';
import { ChatService } from '@chat/user-chat/services/chat.service';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  path: '/chat-socket.io',
})
@UseGuards(WsUserJwtVerifyGuard)
@UsePipes(WsClassValidatorPipe)
@UseFilters(WsExceptionFilter)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly chatService: ChatService,
    private readonly logger: CustomLoggerService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      await this.authService.handleUserConnection(client);
    } catch (error) {
      this.logger.error(error?.message, { error });
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      await this.authService.handleUserDisconnection(client);
    } catch (error) {
      this.logger.error(error?.message, { error });
    }
  }

  @SubscribeMessage(SocketEventsEnum.JOIN_ROOM)
  async joinRoom(
    @WsPersona() userJWT: UserJwtPersona,
    @MessageBody() data: RoomIdDto,
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.chatService.joinRoom(userJWT._id, client, data);

    client.emit(SocketEventsEnum.ROOM_DATA, new CustomResponse().success({ payload: { data: room } }));
  }

  @SubscribeMessage(SocketEventsEnum.LEAVE_ROOM)
  async leaveRoom(
    @WsPersona() userJWT: UserJwtPersona,
    @MessageBody() data: RoomIdDto,
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.chatService.leaveRoom(userJWT._id, client, data);

    client.emit(SocketEventsEnum.LEAVE_ROOM, new CustomResponse().success({ payload: { data: room } }));
  }

  @SubscribeMessage(SocketEventsEnum.USER_DATA)
  async getOtherUserParticipantData(
    @WsPersona() userJWT: UserJwtPersona,
    @MessageBody() data: GetParticipantDataDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = await this.chatService.getOtherUserParticipantData(userJWT._id, data);

    client.emit(SocketEventsEnum.USER_DATA, new CustomResponse().success({ payload: { data: user } }));
  }

  @SubscribeMessage(SocketEventsEnum.SEND_MESSAGE)
  async sendMessage(
    @WsPersona() userJWT: UserJwtPersona,
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const messageAck = await this.chatService.sendMessage(userJWT._id, client, data);

    return messageAck;
  }

  @SubscribeMessage(SocketEventsEnum.DELETE_MESSAGE)
  async deleteMessage(
    @WsPersona() userJWT: UserJwtPersona,
    @MessageBody() data: DeleteMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const deleteAck = await this.chatService.deleteMessage(userJWT._id, client, data);

    return deleteAck;
  }

  @SubscribeMessage(SocketEventsEnum.USER_TYPING)
  async updateUserTypingStatus(
    @WsPersona() userJWT: UserJwtPersona,
    @MessageBody() data: RoomIdDto,
    @ConnectedSocket() client: Socket,
  ) {
    await this.chatService.updateUserTypingStatus(userJWT._id, client, data);
  }

  @SubscribeMessage(SocketEventsEnum.MARK_AS_READ)
  async markRoomMessagesAsRead(
    @WsPersona() userJWT: UserJwtPersona,
    @MessageBody() data: MarkAsReadDto,
    @ConnectedSocket() client: Socket,
  ) {
    await this.chatService.markRoomMessagesAsRead(userJWT._id, client, data);
  }

  @Listen({
    exchange: RabbitExchanges.SOCKET_DISCONNECTION,
    routingKey: RabbitRoutingKeys.SOCKET_DISCONNECTION_EVENTS,
    queue: RabbitQueues.SOCKET_DISCONNECTION_EVENTS,
    queueOptions: {
      durable: true,
    },
  })
  async handleSocketDisconnectionEvent(data: ISocketDisconnectionEvent) {
    await this.chatService.handleSocketDisconnectionEvent(this.server, data);
  }
}
