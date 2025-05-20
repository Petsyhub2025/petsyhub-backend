import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { ModelNames } from '@common/constants';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument, Types } from 'mongoose';
import { PrivateChatRoom } from '../private-chat-room.type';
import { PrivateChatEventsEnum } from '../private-chat.enum';
import { IUserChatRoomRelationModel } from '../../../user-chat-room-relation';

@Injectable()
export class PrivateChatEventListener {
  constructor(
    @Inject(forwardRef(() => ModelNames.USER_CHAT_ROOM_RELATION))
    private userChatRoomRelation: IUserChatRoomRelationModel,
    private readonly errorHandler: EventListenerErrorHandlerService,
  ) {}

  @OnEvent(PrivateChatEventsEnum.DELETE_DOC, { promisify: true })
  async propagateDeletePrivateChat(event: HydratedDocument<PrivateChatRoom>) {
    return this.errorHandler.eventListenerErrorHandler(PrivateChatEventsEnum.DELETE_DOC, async () => {
      await Promise.all([this.deleteUserChatRoomRelations(event._id)]);
    });
  }

  private async deleteUserChatRoomRelations(roomId: Types.ObjectId) {
    const userChatRoomRelations = this.userChatRoomRelation.find({ room: roomId }).cursor();
    for await (const userChatRoomRelation of userChatRoomRelations) {
      await userChatRoomRelation.deleteDoc();
    }
  }
}
