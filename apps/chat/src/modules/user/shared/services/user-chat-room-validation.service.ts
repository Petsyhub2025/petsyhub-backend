import { IUserChatRoomRelationModel, ModelNames, UserChatRoomRelationStatusEnum } from '@instapets-backend/common';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Types } from 'mongoose';
import { wsErrorManager, httpErrorManager } from '@chat/user/shared/configs/error-manager.config';

interface UserChatRoomRelationValidationOptions {
  includeStatus?: boolean;
  isSocket?: boolean;
}

@Injectable()
export class UserChatRoomValidationService {
  constructor(
    @Inject(ModelNames.USER_CHAT_ROOM_RELATION) private userChatRoomRelationModel: IUserChatRoomRelationModel,
  ) {}

  async assertUserChatRoomRelation(
    userId: string | Types.ObjectId,
    roomId: string | Types.ObjectId,
    options: UserChatRoomRelationValidationOptions,
  ) {
    const defaultOptions = {
      includeStatus: true,
    };

    const { includeStatus, isSocket } = { ...defaultOptions, ...options };

    const userChatRoomRelation = await this.userChatRoomRelationModel.findOne({
      user: userId,
      room: roomId,
      ...(includeStatus && { status: UserChatRoomRelationStatusEnum.ACTIVE }),
    });

    if (!userChatRoomRelation) {
      if (isSocket) throw new WsException(wsErrorManager.ROOM_NOT_FOUND);
      else throw new BadRequestException(httpErrorManager.ROOM_NOT_FOUND);
    }

    return userChatRoomRelation;
  }
}
