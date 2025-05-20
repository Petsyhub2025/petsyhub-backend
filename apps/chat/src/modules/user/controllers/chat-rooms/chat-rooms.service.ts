import { getMessageAggregationPipeline } from '@chat/user/shared/aggregations/get-message-aggregation-pipeline.aggregation';
import { httpErrorManager } from '@chat/user/shared/configs/error-manager.config';
import { UserChatRoomValidationService } from '@chat/user/shared/services/user-chat-room-validation.service';
import {
  AppConfig,
  AwsS3Service,
  BasePaginationQuery,
  ChatRoomType,
  CustomLoggerService,
  GetMediaPreSignedUrlQueryDto,
  GroupChatRoom,
  IChatMessageModel,
  IUserChatRoomRelationModel,
  MediaUploadService,
  ModelNames,
  PrivateChatRoom,
  UserChatRoomRelationChatRequestStatusEnum,
  UserChatRoomRelationStatusEnum,
  UserSocketStatusEnum,
  addPaginationStages,
} from '@instapets-backend/common';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Connection, PipelineStage, Types } from 'mongoose';
import { ChatRoomIdParamDto } from './dto/chat-room-id-param.dto';
import { GetRoomMessagesQueryDto } from './dto/get-room-messages.dto';
import { UserChatRoomHelperService } from '@chat/user/shared/services/user-chat-room-helper.service';
import {
  getChatRoomAggregationPipeline,
  getLastMessageAggregationPipeline,
} from './aggregations/get-chat-room-pipeline.aggregation';
import { InjectConnection } from '@nestjs/mongoose';

@Injectable()
export class ChatRoomsService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @Inject(ModelNames.USER_CHAT_ROOM_RELATION) private userChatRoomRelationModel: IUserChatRoomRelationModel,
    @Inject(ModelNames.CHAT_MESSAGE) private chatMessageModel: IChatMessageModel,
    private readonly userChatRoomValidationService: UserChatRoomValidationService,
    private readonly userChatRoomHelperService: UserChatRoomHelperService,
    private readonly logger: CustomLoggerService,
    private readonly mediaUploadService: MediaUploadService,
  ) {}

  async getChatRooms(userId: string) {
    // TODO: Think of a better way to handle sorting this list, since bots can open up a lot of chat rooms and tank the read performance of the db
    const prePaginationPipeline: PipelineStage[] = [
      {
        $match: {
          user: new Types.ObjectId(userId),
          status: UserChatRoomRelationStatusEnum.ACTIVE,
          $or: [
            {
              chatRequesterId: null,
            },
            {
              chatRequesterId: new Types.ObjectId(userId),
            },
          ],
        },
      },
    ];

    const chatRooms = await this.userChatRoomRelationModel.aggregate<Hydrate<PrivateChatRoom & GroupChatRoom>>([
      ...prePaginationPipeline,
      ...getLastMessageAggregationPipeline(),
      ...getChatRoomAggregationPipeline(userId),
    ]);

    return chatRooms;
  }

  async getRoomMessages(
    userId: string,
    { chatRoomId }: ChatRoomIdParamDto,
    { beforeId, limit }: GetRoomMessagesQueryDto,
  ) {
    const { messageFilterStartDate } = await this.userChatRoomValidationService.assertUserChatRoomRelation(
      userId,
      chatRoomId,
      { includeStatus: false },
    );

    const prePaginationPipeline: PipelineStage[] = [
      {
        $match: {
          room: chatRoomId,
          createdAt: {
            $gt: messageFilterStartDate,
          },
          ...(beforeId && { _id: { $lt: beforeId } }),
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ];

    const messages = await this.chatMessageModel.aggregate([
      ...prePaginationPipeline,
      {
        $limit: limit,
      },
      ...getMessageAggregationPipeline(userId),
    ]);

    return messages;
  }

  async clearChatRoomMessages(userId: string, { chatRoomId }: ChatRoomIdParamDto) {
    const userChatRoomRelation = await this.userChatRoomValidationService.assertUserChatRoomRelation(
      userId,
      chatRoomId,
      { includeStatus: false },
    );

    userChatRoomRelation.set({
      lastMessageClearDate: new Date(),
    });

    await userChatRoomRelation.save();
  }

  async getPendingChatRequestUsers(userId: string, { page, limit }: BasePaginationQuery) {
    const prePaginationPipeline: PipelineStage[] = [
      {
        $match: {
          user: new Types.ObjectId(userId),
          status: UserChatRoomRelationStatusEnum.ACTIVE,
          chatRequestStatus: UserChatRoomRelationChatRequestStatusEnum.PENDING,
          $and: [
            { $expr: { $gt: ['$chatRequesterId', null] } },
            { chatRequesterId: { $ne: new Types.ObjectId(userId) } },
          ],
        },
      },
    ];

    const [users, [{ total = 0 } = {}]] = await Promise.all([
      this.userChatRoomRelationModel.aggregate([
        ...prePaginationPipeline,
        ...getLastMessageAggregationPipeline(),
        ...addPaginationStages({ page, limit }),
        ...getChatRoomAggregationPipeline(userId),
      ]),
      this.userChatRoomRelationModel.aggregate([...prePaginationPipeline]).count('total'),
    ]);

    return {
      data: users,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  async acceptChatRequest(userId: string, { chatRoomId }: ChatRoomIdParamDto) {
    const { chatRequesterId } = await this.userChatRoomValidationService.assertUserChatRoomRelation(
      userId,
      chatRoomId,
      { isSocket: false },
    );

    if (chatRequesterId?.toString() === userId) {
      throw new UnprocessableEntityException(httpErrorManager.CANNOT_ACCEPT_OWN_CHAT_REQUEST);
    }

    await this.userChatRoomHelperService.handleChatRequesterInChatRelationUpdate({
      roomId: chatRoomId,
      options: { isSocket: false },
    });
  }

  async rejectChatRequest(userId: string, { chatRoomId }: ChatRoomIdParamDto) {
    const { chatRequesterId } = await this.userChatRoomValidationService.assertUserChatRoomRelation(
      userId,
      chatRoomId,
      { isSocket: false },
    );

    if (chatRequesterId?.toString() === userId) {
      throw new UnprocessableEntityException(httpErrorManager.CANNOT_REJECT_OWN_CHAT_REQUEST);
    }

    const transactionSession = await this.connection.startSession();
    try {
      transactionSession.startTransaction({
        readPreference: 'primary',
      });

      const userChatRoomRelations = await this.userChatRoomRelationModel.find({
        room: chatRoomId,
        status: UserChatRoomRelationStatusEnum.ACTIVE,
      });

      for (const relation of userChatRoomRelations) {
        relation.set({
          chatRequestStatus: UserChatRoomRelationChatRequestStatusEnum.REJECTED,
        });

        await relation.save({ session: transactionSession });
      }

      await transactionSession.commitTransaction();
    } catch (error) {
      await transactionSession.abortTransaction();
      this.logger.error(`Error while rejecting chat request status for room ${chatRoomId}: ${error?.message}`, {
        error,
      });
      throw new InternalServerErrorException(httpErrorManager.ERROR_WHILE_UPDATING_CHAT_REQUEST_STATUS);
    } finally {
      transactionSession.endSession();
    }
  }
}
