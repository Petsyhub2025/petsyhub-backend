import { httpErrorManager, wsErrorManager } from '@chat/user/shared/configs/error-manager.config';
import {
  CustomLoggerService,
  IUserChatRoomRelationModel,
  ModelNames,
  UserChatRoomRelationChatRequestStatusEnum,
  UserChatRoomRelationStatusEnum,
} from '@instapets-backend/common';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { WsException } from '@nestjs/websockets';
import { Connection, Types } from 'mongoose';

type ChatRequesterInChatRelationUpdateOptions = {
  roomId: string | Types.ObjectId;
  userId?: string;
  options?: { isSocket?: boolean };
};

@Injectable()
export class UserChatRoomHelperService {
  constructor(
    @Inject(ModelNames.USER_CHAT_ROOM_RELATION) private userChatRoomRelationModel: IUserChatRoomRelationModel,
    @InjectConnection() private readonly connection: Connection,
    private readonly logger: CustomLoggerService,
  ) {}

  async handleChatRequesterInChatRelationUpdate({ roomId, options, userId }: ChatRequesterInChatRelationUpdateOptions) {
    const transactionSession = await this.connection.startSession();
    try {
      transactionSession.startTransaction({
        readPreference: 'primary',
      });

      const userChatRoomRelations = await this.userChatRoomRelationModel.find({
        room: roomId,
        status: UserChatRoomRelationStatusEnum.ACTIVE,
      });

      for (const relation of userChatRoomRelations) {
        relation.set({
          ...(userId && { chatRequestStatus: UserChatRoomRelationChatRequestStatusEnum.PENDING }),
          ...(!userId && { chatRequestStatus: UserChatRoomRelationChatRequestStatusEnum.ACCEPTED }),
          chatRequesterId: userId || null,
        });

        await relation.save({ session: transactionSession });
      }

      await transactionSession.commitTransaction();
    } catch (error) {
      await transactionSession.abortTransaction();
      this.logger.error(`Error while updating chat request status for room ${roomId}: ${error?.message}`, { error });
      if (options.isSocket) throw new WsException(wsErrorManager.ERROR_WHILE_UPDATING_CHAT_REQUEST_STATUS);
      else throw new InternalServerErrorException(httpErrorManager.ERROR_WHILE_UPDATING_CHAT_REQUEST_STATUS);
    } finally {
      transactionSession.endSession();
    }
  }
}
