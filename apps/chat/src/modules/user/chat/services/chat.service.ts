import { Inject, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import {
  ChatRequestEventsEnum,
  ChatRoomType,
  CustomLoggerService,
  DeepLinkService,
  FirebaseDynamicLinkService,
  GroupChatRoom,
  IBaseChatRoomModel,
  IChatMessageModel,
  ICustomWsError,
  IPrivateChatRoomModel,
  ISocketDisconnectionEvent,
  IUserChatRoomRelationModel,
  IUserModel,
  Media,
  MediaTypeEnum,
  MediaUploadService,
  ModelNames,
  NotificationsHelperService,
  PrivateChatRoom,
  SocketEventsEnum,
  User,
  UserBlockHelperService,
  UserChatRoomRelation,
  UserChatRoomRelationChatRequestStatusEnum,
  UserChatRoomRelationStatusEnum,
  UserNotificationDto,
  UserNotificationTypeEnum,
  UserSocketStatusEnum,
  WsCustomError,
} from '@instapets-backend/common';
import { DeleteMessageDto } from '@chat/user-chat/dto/delete-message.dto';
import { GetParticipantDataDto } from '@chat/user-chat/dto/get-participant-data.dto';
import { MarkAsReadDto } from '@chat/user-chat/dto/mark-as-read.dto';
import { RoomIdDto } from '@chat/user-chat/dto/room-id.dto';
import { SendMessageDto } from '@chat/user-chat/dto/send-message.dto';
import { getMessageAggregationPipeline } from '@chat/user/shared/aggregations/get-message-aggregation-pipeline.aggregation';
import { wsErrorManager } from '@chat/user/shared/configs/error-manager.config';
import { UserChatRoomValidationService } from '@chat/user/shared/services/user-chat-room-validation.service';
import { Connection, Types } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { UserFollowValidationService } from '@chat/user/shared/services/user-follow-validation.service';
import { InjectConnection } from '@nestjs/mongoose';
import { UserChatRoomHelperService } from '@chat/user/shared/services/user-chat-room-helper.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UploadModelResources } from '@serverless/common/enums/upload-model-resources.enum';

@Injectable()
export class ChatService {
  constructor(
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.USER_CHAT_ROOM_RELATION) private userChatRoomRelationModel: IUserChatRoomRelationModel,
    @Inject(ModelNames.BASE_CHAT_ROOM) private baseChatRoomModel: IBaseChatRoomModel,
    @Inject(ModelNames.CHAT_MESSAGE) private chatMessageModel: IChatMessageModel,
    private readonly userBlockHelperService: UserBlockHelperService,
    private readonly notificationsHelperService: NotificationsHelperService,
    private readonly logger: CustomLoggerService,
    private readonly deepLinkService: DeepLinkService,
    private readonly dynamicLinkService: FirebaseDynamicLinkService,
    private readonly userChatRoomValidationService: UserChatRoomValidationService,
    private readonly userFollowValidationService: UserFollowValidationService,
    private readonly userChatRoomHelperService: UserChatRoomHelperService,
    private readonly eventEmitter: EventEmitter2,
    private readonly mediaUploadService: MediaUploadService,
  ) {}

  async joinRoom(userId: string, client: Socket, { roomId }: RoomIdDto) {
    await this.userChatRoomValidationService.assertUserChatRoomRelation(userId, roomId, { isSocket: true });

    const [chatRoom] = await this.baseChatRoomModel.aggregate<Hydrate<GroupChatRoom & PrivateChatRoom>>([
      {
        $match: {
          _id: new Types.ObjectId(roomId),
        },
      },
      // Process private chat room details
      {
        $addFields: {
          participants: {
            $filter: {
              input: { $ifNull: ['$participants', []] },
              as: 'participant',
              cond: {
                $ne: ['$$participant', new Types.ObjectId(userId)],
              },
            },
          },
        },
      },
      {
        $unwind: {
          path: '$participants',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          let: {
            participantId: { $ifNull: ['$participants', null] },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$participantId'],
                },
              },
            },
            {
              $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                profilePictureMedia: 1,
                socketStatus: 1,
                lastSocketActiveDate: 1,
              },
            },
          ],
          as: 'participant',
        },
      },
      {
        $unwind: {
          path: '$participant',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unset: ['participants'],
      },
      {
        $addFields: {
          name: {
            $ifNull: [
              '$name',
              {
                $cond: [
                  { $gt: ['$participant', null] },
                  { $concat: ['$participant.firstName', ' ', '$participant.lastName'] },
                  'Petsy User',
                ],
              },
            ],
          },
          roomPictureMedia: { $ifNull: ['$roomPictureMedia', '$participant.profilePictureMedia'] },
          participantId: '$participant._id',
        },
      },
      {
        $lookup: {
          from: 'userchatroomrelations',
          let: {
            roomId: '$_id',
            userId: new Types.ObjectId(userId),
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$room', '$$roomId'] },
                    { $eq: ['$user', '$$userId'] },
                    { $eq: ['$status', UserChatRoomRelationStatusEnum.ACTIVE] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 0,
                chatRequestStatus: 1,
                chatRequesterId: 1,
              },
            },
          ],
          as: 'userChatRoomRelation',
        },
      },
      {
        $unwind: {
          path: '$userChatRoomRelation',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          isInviteRoom: {
            $cond: {
              if: {
                $and: [
                  {
                    $eq: ['$chatRoomType', ChatRoomType.PRIVATE],
                  },
                  {
                    $or: [
                      {
                        $eq: [
                          '$userChatRoomRelation.chatRequestStatus',
                          UserChatRoomRelationChatRequestStatusEnum.PENDING,
                        ],
                      },
                      {
                        $eq: [
                          '$userChatRoomRelation.chatRequestStatus',
                          UserChatRoomRelationChatRequestStatusEnum.REJECTED,
                        ],
                      },
                    ],
                  },
                  {
                    $and: [
                      { $gt: ['$userChatRoomRelation.chatRequesterId', null] },
                      { $ne: ['$userChatRoomRelation.chatRequesterId', new Types.ObjectId(userId)] },
                    ],
                  },
                ],
              },
              then: true,
              else: false,
            },
          },
          isChatRequester: {
            $cond: {
              if: {
                $and: [
                  {
                    $eq: ['$chatRoomType', ChatRoomType.PRIVATE],
                  },
                  {
                    $eq: ['$userChatRoomRelation.chatRequestStatus', UserChatRoomRelationChatRequestStatusEnum.PENDING],
                  },
                  {
                    $eq: ['$userChatRoomRelation.chatRequesterId', new Types.ObjectId(userId)],
                  },
                ],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          roomPictureMedia: 1,
          chatRoomType: 1,
          isInviteRoom: 1,
          isChatRequester: 1,
          participantId: {
            $cond: {
              if: { $eq: ['$chatRoomType', ChatRoomType.PRIVATE] },
              then: '$participantId',
              else: '$$REMOVE',
            },
          },
        },
      },
    ]);

    if (!chatRoom) {
      throw new WsException(wsErrorManager.ROOM_NOT_FOUND);
    }

    client.join(roomId.toString());

    return chatRoom;
  }

  async leaveRoom(userId: string, client: Socket, { roomId }: RoomIdDto) {
    await this.userChatRoomValidationService.assertUserChatRoomRelation(userId, roomId, { isSocket: true });

    client.leave(roomId.toString());

    return { roomId };
  }

  async getOtherUserParticipantData(userId: string, { participantId, roomId }: GetParticipantDataDto) {
    await Promise.all([
      this.userChatRoomValidationService.assertUserChatRoomRelation(userId, roomId, { isSocket: true }),
      this.userChatRoomValidationService.assertUserChatRoomRelation(participantId, roomId, { isSocket: true }),
    ]);

    const [participant] = await this.userModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(participantId),
        },
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          profilePictureMedia: 1,
          socketStatus: 1,
          lastSocketActiveDate: 1,
        },
      },
    ]);

    if (!participant) {
      return { firstName: 'Petsy', lastName: 'User' };
    }

    return participant;
  }

  async sendMessage(userId: string, client: Socket, data: SendMessageDto) {
    try {
      const { roomId, mediaUploads } = data;
      let chatRequestCreated = false;

      const { chatRequesterId, chatRequestStatus } =
        await this.userChatRoomValidationService.assertUserChatRoomRelation(userId, roomId, {
          isSocket: true,
        });

      if (chatRequesterId?.toString() === userId) {
        throw new WsException(wsErrorManager.NOT_ALLOWED_TO_SEND_MESSAGE_TO_ROOM);
      }

      const { isAllowed, chatRoom, recipientId } = await this.assertUserAllowedToSendToChatRoom(userId, roomId);
      if (!isAllowed) {
        throw new WsException(wsErrorManager.NOT_ALLOWED_TO_SEND_MESSAGE_TO_ROOM);
      }

      const message = new this.chatMessageModel();

      message.set({
        ...data,
        sender: new Types.ObjectId(userId),
        room: new Types.ObjectId(roomId),
        isSent: true,
      });

      // If the chat room is private, no previous chat request and the sender is not following the recipient, update the chat relation to add a chat request
      if (
        chatRoom.chatRoomType === ChatRoomType.PRIVATE &&
        !chatRequesterId &&
        chatRequestStatus === UserChatRoomRelationChatRequestStatusEnum.NONE
      ) {
        const [isFollowing, hasMessageFromRecipient] = await Promise.all([
          this.userFollowValidationService.isUserFollowingOrPublic(userId, [recipientId]),
          this.chatMessageModel.exists({
            room: roomId,
            sender: recipientId,
          }),
        ]);

        if (!isFollowing && !hasMessageFromRecipient) {
          await this.userChatRoomHelperService.handleChatRequesterInChatRelationUpdate({
            roomId,
            userId,
            options: { isSocket: true },
          });
          chatRequestCreated = true;
          this.eventEmitter.emit(ChatRequestEventsEnum.SEND_NOTIFICATION, {
            userId,
            recipientId,
          });
        }
      }

      // If the chat room is private and the chat requester is not the sender, update the chat relation to remove the chat request
      if (
        chatRoom.chatRoomType === ChatRoomType.PRIVATE &&
        chatRequesterId != undefined &&
        chatRequesterId?.toString() !== userId &&
        (chatRequestStatus === UserChatRoomRelationChatRequestStatusEnum.PENDING ||
          chatRequestStatus === UserChatRoomRelationChatRequestStatusEnum.REJECTED)
      ) {
        await this.userChatRoomHelperService.handleChatRequesterInChatRelationUpdate({
          roomId,
          options: { isSocket: true },
        });
      }

      if (mediaUploads?.length) {
        const { media, mediaProcessingId } = await this.mediaUploadService.handleMediaUploads(
          {
            files: mediaUploads,
            filesS3PathPrefix: `${userId}/chats/${roomId}`,
            resourceModel: {
              name: UploadModelResources.CHAT_MESSAGE_MEDIA,
            },
            allowedMediaTypes: [MediaTypeEnum.IMAGE, MediaTypeEnum.VIDEO, MediaTypeEnum.AUDIO],
          },
          true,
        );

        message.set({
          media,
          mediaProcessingId,
        });
      }

      await message.save();

      const [_message] = await this.chatMessageModel.aggregate([
        {
          $match: {
            _id: message._id,
          },
        },
        ...getMessageAggregationPipeline(userId),
      ]);

      // Emit to room except sender
      client.broadcast.to(roomId.toString()).emit(SocketEventsEnum.NEW_MESSAGE, _message);

      if (!chatRequestCreated) {
        this.broadCastNewMessageNotification(userId, roomId, { body: data.body, media: _message.media }).catch(
          (error) => {
            this.logger.error(error?.message ?? error, { error });
          },
        );
      }

      return {
        ..._message,
        isInviteRoom: chatRoom.chatRoomType === ChatRoomType.PRIVATE && chatRequestCreated,
      };
    } catch (error) {
      if (error instanceof WsException) {
        const wsError = error?.getError();

        if (typeof wsError === 'string') {
          throw error;
        }

        if (!(wsError instanceof WsCustomError)) {
          throw error;
        }

        const wsErrorWithClientPendingMessageId = {
          ...wsError,
          error: {
            ...wsError.error,
            clientPendingMessageId: data.clientPendingMessageId,
          },
        };

        throw new WsException(wsErrorWithClientPendingMessageId);
      }

      throw error;
    }
  }

  async deleteMessage(userId: string, client: Socket, { roomId, messageId }: DeleteMessageDto) {
    const { chatRequesterId } = await this.userChatRoomValidationService.assertUserChatRoomRelation(userId, roomId, {
      isSocket: true,
    });

    if (chatRequesterId?.toString() === userId) {
      throw new WsException(wsErrorManager.NOT_ALLOWED_TO_DELETE_MESSAGE);
    }

    const message = await this.chatMessageModel.findOne({
      _id: messageId,
      room: roomId,
      sender: userId,
    });

    if (!message) {
      throw new WsException(wsErrorManager.MESSAGE_NOT_FOUND);
    }

    const deletionThresholdInMs = 30 * 60 * 1000; // 30 minutes
    const differenceInMs = new Date().getTime() - new Date(message.createdAt).getTime();

    if (differenceInMs > deletionThresholdInMs) {
      throw new WsException(wsErrorManager.MESSAGE_DELETION_THRESHOLD_EXCEEDED);
    }

    await message.deleteDoc();

    const userChatRoomRelations = this.userChatRoomRelationModel
      .find({
        room: roomId,
        user: { $ne: userId },
        status: UserChatRoomRelationStatusEnum.ACTIVE,
      })
      .populate<{ user: Hydrate<User> }>([
        {
          path: 'user',
          select: {
            _id: 1,
            socketId: 1,
            socketStatus: 1,
          },
        },
      ])
      .cursor();

    for await (const { user } of userChatRoomRelations) {
      const participant = user as unknown as Hydrate<User>;

      if (!participant.socketId || participant.socketStatus === UserSocketStatusEnum.OFFLINE) {
        continue;
      }

      client.broadcast.to(participant.socketId).emit(SocketEventsEnum.MESSAGE_DELETED, { roomId, messageId });
    }

    return { messageId };
  }

  async markRoomMessagesAsRead(userId: string, client: Socket, { roomId, lastMessageId }: MarkAsReadDto) {
    const userChatRoomRelation = await this.userChatRoomValidationService.assertUserChatRoomRelation(userId, roomId, {
      isSocket: true,
    });

    const lastRoomMessage = await this.chatMessageModel
      .findOne(
        {
          room: roomId,
          sender: { $ne: userId },
          _id: lastMessageId,
          // createdAt: {
          //   $lte: lastMessageSeenDate,
          // },
        },
        {
          _id: 1,
          createdAt: 1,
        },
      )
      .lean();

    if (!lastRoomMessage) {
      throw new WsException(wsErrorManager.MESSAGE_NOT_FOUND);
    }

    const lastMessageSeenDate = new Date();
    userChatRoomRelation.set({
      lastMessageSeenDate,
      lastMessageSeenId: lastRoomMessage?._id,
    });

    await userChatRoomRelation.save();

    // Emit to room except sender
    client.broadcast
      .to(roomId.toString())
      .emit(SocketEventsEnum.MESSAGE_READ, { roomId, userId, messageId: lastRoomMessage?._id });
  }

  async updateUserTypingStatus(userId: string, client: Socket, { roomId }: RoomIdDto) {
    await this.userChatRoomValidationService.assertUserChatRoomRelation(userId, roomId, { isSocket: true });

    const typingUser = await this.userModel.findById(userId, {
      _id: 1,
      firstName: 1,
      lastName: 1,
    });
    const userChatRoomRelations = this.userChatRoomRelationModel
      .find({
        room: roomId,
        user: { $ne: userId },
        status: UserChatRoomRelationStatusEnum.ACTIVE,
      })
      .populate<{ user: Hydrate<User> }>([
        {
          path: 'user',
          select: {
            _id: 1,
            socketId: 1,
            socketStatus: 1,
          },
        },
      ])
      .cursor();

    for await (const { user } of userChatRoomRelations) {
      const participant = user as unknown as Hydrate<User>;

      if (!participant.socketId || participant.socketStatus === UserSocketStatusEnum.OFFLINE) {
        continue;
      }

      client.broadcast.to(participant.socketId).emit(SocketEventsEnum.USER_TYPING, {
        roomId,
        user: { _id: userId, firstName: typingUser?.firstName, lastName: typingUser?.lastName },
      });
    }
  }

  async handleSocketDisconnectionEvent(server: Server, { socketId }: ISocketDisconnectionEvent) {
    if (!socketId) {
      this.logger.error(`[SOCKET_DISCONNECTION] Socket id is missing`);
      return;
    }

    const socket = server.sockets.sockets.get(socketId);

    if (!socket) {
      this.logger.error(`[SOCKET_DISCONNECTION] Socket not found with id: ${socketId}`);
      return;
    }

    socket.disconnect(true);
  }

  private async broadCastNewMessageNotification(
    userId: string,
    roomId: string | Types.ObjectId,
    { body, media }: { body: string; media: Media[] },
  ) {
    const [user, [chatRoom]] = await Promise.all([
      this.userModel.findById(userId, {
        _id: 1,
        firstName: 1,
        lastName: 1,
        profilePictureMedia: 1,
      }),
      this.baseChatRoomModel.aggregate<Hydrate<GroupChatRoom & PrivateChatRoom>>([
        {
          $match: {
            _id: new Types.ObjectId(roomId),
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            roomPictureMedia: 1,
            participants: 1,
            chatRoomType: 1,
          },
        },
      ]),
    ]);

    if (!user) {
      throw new WsException(wsErrorManager.USER_NOT_FOUND);
    }

    if (!chatRoom) {
      throw new WsException(wsErrorManager.ROOM_NOT_FOUND);
    }

    const docs = this.userChatRoomRelationModel
      .find({
        room: roomId,
        user: { $ne: userId },
        status: UserChatRoomRelationStatusEnum.ACTIVE,
      })
      .cursor();

    const isGroup = chatRoom.chatRoomType === ChatRoomType.GROUP;

    const notifications: UserNotificationDto[] = [];
    for await (const { user: participant } of docs) {
      const notification: UserNotificationDto = {
        title: {
          en: isGroup ? `${user.firstName} @ ${chatRoom.name}` : `${user.firstName} ${user.lastName}`,
          ar: isGroup ? `${user.firstName} @ ${chatRoom.name}` : `${user.firstName} ${user.lastName}`,
        },
        ...(body && {
          body: {
            en: body,
            ar: body,
          },
        }),
        receiverUserId: participant.toString(),
        deepLink: this.deepLinkService.getDefaultUserDeepLink(),
        dynamicLink: this.dynamicLinkService.getDefaultFirebaseDynamicLink(),
        imageMedia: media?.[0],
        notificationType: UserNotificationTypeEnum.CHAT_MESSAGE,
        data: {
          senderId: user._id.toString(),
          senderFirstName: user.firstName,
          senderLastName: user.lastName,
          senderProfilePictureUrl: user.profilePictureMedia?.url,
          roomId: chatRoom._id.toString(),
          roomName: chatRoom.name,
          roomPictureUrl: isGroup ? chatRoom.roomPictureMedia?.url : user.profilePictureMedia?.url,
          roomChatRoomType: chatRoom.chatRoomType,
          messagePictureUrl: media?.[0]?.url,
        },
      };

      notifications.push(notification);
    }
    await this.notificationsHelperService.sendUserChatNotificationToNotificationService(notifications);
  }

  private async assertUserAllowedToSendToChatRoom(userId: string, roomId: string | Types.ObjectId) {
    const [chatRoomRelation] = await this.userChatRoomRelationModel.aggregate<
      Hydrate<UserChatRoomRelation & { room: Hydrate<GroupChatRoom & PrivateChatRoom> }>
    >([
      {
        $match: {
          user: new Types.ObjectId(userId),
          room: new Types.ObjectId(roomId),
          status: UserChatRoomRelationStatusEnum.ACTIVE,
        },
      },
      {
        $lookup: {
          from: 'basechatrooms',
          let: {
            roomId: '$room',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$roomId'],
                },
              },
            },
            {
              $project: {
                _id: 1,
                chatRoomType: 1,
                participants: 1,
              },
            },
          ],
          as: 'room',
        },
      },
      {
        $unwind: {
          path: '$room',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          room: 1,
        },
      },
    ]);

    if (!chatRoomRelation) {
      throw new WsException(wsErrorManager.NOT_ALLOWED_TO_SEND_MESSAGE_TO_ROOM);
    }

    const { room } = chatRoomRelation;

    if (room.chatRoomType === ChatRoomType.PRIVATE) {
      const recipientId = room.participants.find((participant) => participant.toString() !== userId);
      const areUsersMutuallyOrPartiallyBlocked = await this.userBlockHelperService.areUsersMutuallyOrPartiallyBlocked(
        userId,
        recipientId,
      );
      const recipientExists = await this.userModel.exists({ _id: recipientId, isViewable: true });
      const isAllowed = !areUsersMutuallyOrPartiallyBlocked && recipientExists;

      return {
        isAllowed,
        chatRoom: room,
        recipientId,
      };
    }

    return {
      isAllowed: true,
    };
  }
}
