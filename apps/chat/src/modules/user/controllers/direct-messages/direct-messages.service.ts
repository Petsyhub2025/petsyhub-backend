import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IPrivateChatRoomModel, IUserChatRoomRelationModel, IUserModel, ModelNames } from '@instapets-backend/common';
import { httpErrorManager } from '@chat/user/shared/configs/error-manager.config';
import { UserFollowValidationService } from '@chat/user/shared/services/user-follow-validation.service';
import { Connection, Types } from 'mongoose';
import { InitDirectMessageDto } from './dto/init-direct-message.dto';
import { InjectConnection } from '@nestjs/mongoose';

@Injectable()
export class DirectMessagesService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.PRIVATE_CHAT_ROOM) private privateChatRoomModel: IPrivateChatRoomModel,
    @Inject(ModelNames.USER_CHAT_ROOM_RELATION) private userChatRoomRelationModel: IUserChatRoomRelationModel,
    private readonly userFollowValidationService: UserFollowValidationService,
  ) {}

  async initDirectMessage(userId: string, { recipientId }: InitDirectMessageDto) {
    if (userId === recipientId?.toString()) {
      throw new NotFoundException(httpErrorManager.CANNOT_INIT_DIRECT_MESSAGE_WITH_SELF);
    }

    const [user, recipient, existingRoom] = await Promise.all([
      this.userModel.findById(userId),
      this.userModel.findById(recipientId),
      this.privateChatRoomModel
        .findOne(
          {
            participants: { $all: [userId, recipientId], $size: 2 },
          },
          { _id: 1 },
        )
        .lean(),
    ]);

    if (!user || !recipient) {
      throw new NotFoundException(httpErrorManager.USER_NOT_FOUND);
    }

    if (existingRoom) {
      return existingRoom;
    }

    const transactionSession = await this.connection.startSession();
    try {
      transactionSession.startTransaction({
        readPreference: 'primary',
      });

      const directMessageRoom = await new this.privateChatRoomModel({
        participants: [new Types.ObjectId(userId), new Types.ObjectId(recipientId)],
      }).save({ session: transactionSession });

      for (const participant of [userId, recipientId]) {
        await new this.userChatRoomRelationModel({
          user: new Types.ObjectId(participant),
          room: new Types.ObjectId(directMessageRoom._id),
          lastJoinDate: new Date(),
        }).save({ session: transactionSession });
      }

      await transactionSession.commitTransaction();

      return this.privateChatRoomModel.findById(directMessageRoom._id, { _id: 1 }).lean();
    } catch (error) {
      await transactionSession.abortTransaction();
      throw error;
    } finally {
      transactionSession.endSession();
    }
  }
}
