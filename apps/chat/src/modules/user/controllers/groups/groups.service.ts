import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import {
  IGroupChatRoomModel,
  IUserChatRoomRelationModel,
  IUserModel,
  MediaTypeEnum,
  MediaUploadService,
  ModelNames,
  UserChatRoomRelationRoleEnum,
  UserChatRoomRelationStatusEnum,
} from '@instapets-backend/common';
import { httpErrorManager } from '@chat/user/shared/configs/error-manager.config';
import { MAX_GROUP_PARTICIPANTS } from '@chat/user/shared/constants';
import { GroupChatParamDto } from '@chat/user/shared/dto/group-chat.dto';
import { UserFollowValidationService } from '@chat/user/shared/services/user-follow-validation.service';
import { Connection } from 'mongoose';
import { AddParticipantDto } from './dto/add-participant.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { removeParticipantQueryDto } from './dto/remove-participant.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { UploadModelResources } from '@serverless/common/enums/upload-model-resources.enum';

@Injectable()
export class GroupsService {
  constructor(
    private readonly userFollowValidationService: UserFollowValidationService,
    @InjectConnection() private readonly connection: Connection,
    @Inject(ModelNames.USER) private readonly userModel: IUserModel,
    @Inject(ModelNames.GROUP_CHAT_ROOM) private readonly groupChatRoomModel: IGroupChatRoomModel,
    @Inject(ModelNames.USER_CHAT_ROOM_RELATION) private readonly userChatRoomRelation: IUserChatRoomRelationModel,
    private readonly mediaUploadService: MediaUploadService,
  ) {}

  async createGroup(userId: string, { participants, name, roomPictureMediaUpload }: CreateGroupDto) {
    if (participants.includes(userId)) {
      throw new BadRequestException(httpErrorManager.CANNOT_ADD_SELF_TO_GROUP);
    }

    const areUsersExist = await this.areUsersExist(participants);
    if (!areUsersExist) {
      throw new BadRequestException(httpErrorManager.USER_NOT_FOUND);
    }

    const areParticipantsFollowed = await this.userFollowValidationService.isUserFollowing(userId, participants);
    if (!areParticipantsFollowed) {
      throw new BadRequestException(httpErrorManager.PARTICIPANTS_NOT_FOLLOWED_BY_USER);
    }

    const session = await this.connection.startSession();

    try {
      session.startTransaction({
        readPreference: 'primary',
      });
      const group = new this.groupChatRoomModel({
        name,
      });

      if (roomPictureMediaUpload) {
        const { media, mediaProcessingId } = await this.mediaUploadService.handleMediaUploads({
          files: [roomPictureMediaUpload],
          filesS3PathPrefix: `${userId}/groups/room-pictures`,
          resourceModel: {
            name: UploadModelResources.GROUP_CHAT_ROOM_PICTURE,
          },
          allowedMediaTypes: [MediaTypeEnum.IMAGE],
        });

        group.set({
          roomPictureMedia: media,
          roomPictureMediaProcessingId: mediaProcessingId,
        });
      }

      const groupData = await group.save({ session });

      const joinDate = new Date();

      const ownChatRoomRelation = new this.userChatRoomRelation({
        user: userId,
        room: groupData._id,
        lastJoinDate: joinDate,
        role: UserChatRoomRelationRoleEnum.OWNER,
      });
      await ownChatRoomRelation.save({ session });

      for (const participant of participants) {
        const userChatRoomRelation = new this.userChatRoomRelation({
          user: participant,
          room: groupData._id,
          lastJoinDate: joinDate,
        });

        await userChatRoomRelation.save({ session });
      }

      await session.commitTransaction();

      return this.groupChatRoomModel
        .findById(groupData._id, { _id: 1, roomPictureMedia: 1, name: 1, chatRoomType: 1 })
        .lean();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async addParticipants(userId: string, { groupChatRoomId }: GroupChatParamDto, { participants }: AddParticipantDto) {
    const isUserAlreadyParticipant = participants.includes(userId);
    if (isUserAlreadyParticipant) {
      throw new BadRequestException(httpErrorManager.CANNOT_ADD_SELF_TO_GROUP);
    }

    const isGroupChatRoomExists = await this.groupChatRoomModel.exists({ _id: groupChatRoomId });
    if (!isGroupChatRoomExists) {
      throw new BadRequestException(httpErrorManager.GROUP_CHAT_ROOM_NOT_FOUND);
    }

    const isUserInGroup = await this.userChatRoomRelation.exists({
      user: userId,
      room: groupChatRoomId,
      status: UserChatRoomRelationStatusEnum.ACTIVE,
    });
    if (!isUserInGroup) {
      throw new BadRequestException(httpErrorManager.USER_NOT_AUTHORIZED_TO_DO_ACTION);
    }

    const isUserAllowedToModify = await this.userChatRoomRelation.exists({
      user: userId,
      room: groupChatRoomId,
      role: { $in: [UserChatRoomRelationRoleEnum.ADMIN, UserChatRoomRelationRoleEnum.OWNER] },
    });
    if (!isUserAllowedToModify) {
      throw new UnauthorizedException(httpErrorManager.USER_NOT_AUTHORIZED_TO_DO_ACTION);
    }

    const areUsersExist = await this.areUsersExist(participants);
    if (!areUsersExist) {
      throw new BadRequestException(httpErrorManager.USER_NOT_FOUND);
    }

    const currentParticipantsCount = await this.userChatRoomRelation
      .find({ room: groupChatRoomId, status: UserChatRoomRelationStatusEnum.ACTIVE })
      .limit(MAX_GROUP_PARTICIPANTS)
      .countDocuments();

    const isMaxParticipantsReached = currentParticipantsCount + participants.length > MAX_GROUP_PARTICIPANTS;
    if (isMaxParticipantsReached) {
      throw new BadRequestException(httpErrorManager.MAX_PARTICIPANTS_REACHED);
    }

    const areParticipantsAlreadyInGroup = await this.participantsExist(participants, groupChatRoomId);
    if (areParticipantsAlreadyInGroup) {
      throw new BadRequestException(httpErrorManager.PARTICIPANTS_ALREADY_IN_GROUP);
    }

    const areParticipantsFollowed = await this.userFollowValidationService.isUserFollowing(userId, participants);
    if (!areParticipantsFollowed) {
      throw new BadRequestException(httpErrorManager.PARTICIPANTS_NOT_FOLLOWED_BY_USER);
    }

    const session = await this.connection.startSession();

    try {
      session.startTransaction({
        readPreference: 'primary',
      });

      const joinDate = new Date();

      for (const participant of participants) {
        const relation = await this.userChatRoomRelation
          .findOne({ user: participant, room: groupChatRoomId, status: UserChatRoomRelationStatusEnum.INACTIVE })
          .session(session);

        const userChatRoomRelation = relation || new this.userChatRoomRelation();
        userChatRoomRelation.set({
          user: participant,
          room: groupChatRoomId,
          status: UserChatRoomRelationStatusEnum.ACTIVE,
          lastJoinDate: joinDate,
        });

        await userChatRoomRelation.save({ session });
      }

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async removeParticipant(
    userId: string,
    { groupChatRoomId }: GroupChatParamDto,
    { participant }: removeParticipantQueryDto,
  ) {
    const isRemovingSelf = participant === userId;
    if (isRemovingSelf) {
      throw new BadRequestException(httpErrorManager.CANNOT_REMOVE_SELF_FROM_GROUP);
    }

    const isGroupChatRoomExists = await this.groupChatRoomModel.exists({ _id: groupChatRoomId });
    if (!isGroupChatRoomExists) {
      throw new BadRequestException(httpErrorManager.GROUP_CHAT_ROOM_NOT_FOUND);
    }

    const isUserInGroup = await this.userChatRoomRelation.exists({
      user: userId,
      room: groupChatRoomId,
      status: UserChatRoomRelationStatusEnum.ACTIVE,
    });
    if (!isUserInGroup) {
      throw new BadRequestException(httpErrorManager.USER_NOT_AUTHORIZED_TO_DO_ACTION);
    }

    const userRelation = await this.userChatRoomRelation.find({
      user: userId,
      room: groupChatRoomId,
      role: { $in: [UserChatRoomRelationRoleEnum.ADMIN, UserChatRoomRelationRoleEnum.OWNER] },
    });
    if (!userRelation) {
      throw new UnauthorizedException(httpErrorManager.USER_NOT_AUTHORIZED_TO_DO_ACTION);
    }

    const areUsersExist = await this.areUsersExist([participant]);
    if (!areUsersExist) {
      throw new BadRequestException(httpErrorManager.USER_NOT_FOUND);
    }

    const isParticipantAlreadyInGroup = await this.participantsExist([participant], groupChatRoomId);
    if (!isParticipantAlreadyInGroup) {
      throw new NotFoundException(httpErrorManager.PARTICIPANT_NOT_IN_GROUP);
    }

    const userToBeRemoved = await this.userChatRoomRelation.findOne({
      user: participant,
      room: groupChatRoomId,
      status: UserChatRoomRelationStatusEnum.ACTIVE,
    });

    if (userToBeRemoved.role === UserChatRoomRelationRoleEnum.OWNER) {
      throw new BadRequestException(httpErrorManager.CANNOT_REMOVE_OWNER);
    }
    userToBeRemoved.set({
      status: UserChatRoomRelationStatusEnum.INACTIVE,
      lastLeaveDate: new Date(),
    });

    await userToBeRemoved.save();
  }

  async leaveGroup(userId: string, { groupChatRoomId }: GroupChatParamDto) {
    const isGroupChatRoomExists = await this.groupChatRoomModel.exists({ _id: groupChatRoomId });
    if (!isGroupChatRoomExists) {
      throw new BadRequestException(httpErrorManager.GROUP_CHAT_ROOM_NOT_FOUND);
    }

    const session = await this.connection.startSession();

    try {
      session.startTransaction({
        readPreference: 'primary',
      });

      const userRelation = await this.userChatRoomRelation
        .findOne({
          user: userId,
          room: groupChatRoomId,
          status: UserChatRoomRelationStatusEnum.ACTIVE,
        })
        .session(session);

      if (!userRelation) {
        throw new BadRequestException(httpErrorManager.USER_NOT_AUTHORIZED_TO_DO_ACTION);
      }

      const userCount = await this.userChatRoomRelation
        .find({ room: groupChatRoomId, status: UserChatRoomRelationStatusEnum.ACTIVE })
        .session(session)
        .countDocuments();

      if (userCount === 1) {
        const groupChat = await this.groupChatRoomModel.findById(groupChatRoomId).session(session);
        await groupChat.deleteDoc();
        await session.commitTransaction();
        return;
      }

      if (userRelation.role === UserChatRoomRelationRoleEnum.OWNER) {
        const newOwner = await this.userChatRoomRelation
          .findOne({
            room: groupChatRoomId,
            status: UserChatRoomRelationStatusEnum.ACTIVE,
            user: { $ne: userId },
          })
          .session(session)
          .sort({ lastJoinDate: 1 });

        newOwner.set({
          role: UserChatRoomRelationRoleEnum.OWNER,
        });
        await newOwner.save({ session });
      }

      userRelation.set({
        status: UserChatRoomRelationStatusEnum.INACTIVE,
        lastLeaveDate: new Date(),
        role: UserChatRoomRelationRoleEnum.MEMBER,
      });
      await userRelation.save({ session });

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async updateGroup(
    userId: string,
    { groupChatRoomId }: GroupChatParamDto,
    { name, roomPictureMediaUpload }: UpdateGroupDto,
  ) {
    const groupChat = await this.groupChatRoomModel.findById(groupChatRoomId);
    if (!groupChat) {
      throw new BadRequestException(httpErrorManager.GROUP_CHAT_ROOM_NOT_FOUND);
    }

    const isUserAllowedToModify = await this.userChatRoomRelation.exists({
      user: userId,
      room: groupChatRoomId,
      role: { $in: [UserChatRoomRelationRoleEnum.ADMIN, UserChatRoomRelationRoleEnum.OWNER] },
    });
    if (!isUserAllowedToModify) {
      throw new UnauthorizedException(httpErrorManager.USER_NOT_AUTHORIZED_TO_DO_ACTION);
    }

    if (roomPictureMediaUpload) {
      const { media, mediaProcessingId } = await this.mediaUploadService.handleMediaUploads({
        files: [roomPictureMediaUpload],
        filesS3PathPrefix: `${userId}/groups/room-pictures`,
        resourceModel: {
          name: UploadModelResources.GROUP_CHAT_ROOM_PICTURE,
          ...(groupChat.roomPictureMediaProcessingId && { mediaProcessingId: groupChat.roomPictureMediaProcessingId }),
        },
        allowedMediaTypes: [MediaTypeEnum.IMAGE],
      });

      groupChat.set({
        roomPictureMedia: media,
        roomPictureMediaProcessingId: mediaProcessingId,
      });
    }

    groupChat.set({
      name,
    });

    await groupChat.save();

    return this.groupChatRoomModel
      .findById(groupChatRoomId, { _id: 1, roomPictureMedia: 1, name: 1, chatRoomType: 1 })
      .lean();
  }

  async deleteGroup(userId: string, { groupChatRoomId }: GroupChatParamDto) {
    const groupChat = await this.groupChatRoomModel.findById(groupChatRoomId);
    if (!groupChat) {
      throw new BadRequestException(httpErrorManager.GROUP_CHAT_ROOM_NOT_FOUND);
    }

    const isUserAllowedToModify = await this.userChatRoomRelation.exists({
      user: userId,
      room: groupChatRoomId,
      role: UserChatRoomRelationRoleEnum.OWNER,
    });
    if (!isUserAllowedToModify) {
      throw new UnauthorizedException(httpErrorManager.USER_NOT_AUTHORIZED_TO_DO_ACTION);
    }

    const userCount = await this.userChatRoomRelation
      .find({ room: groupChatRoomId, status: UserChatRoomRelationStatusEnum.ACTIVE })
      .countDocuments();

    if (userCount !== 1) {
      throw new BadRequestException(httpErrorManager.CAN_ONLY_DELETE_GROUP_WITH_ONE_USER);
    }

    await groupChat.deleteDoc();
  }

  private async areUsersExist(users: string[]) {
    const existingUserCount = await this.userModel.find({ _id: { $in: users } }).countDocuments();
    return existingUserCount === users.length;
  }

  private async participantsExist(participants: string[], roomId: string) {
    const participantsExist = await this.userChatRoomRelation.exists({
      user: { $in: participants },
      room: roomId,
      status: UserChatRoomRelationStatusEnum.ACTIVE,
    });
    return !!participantsExist;
  }
}
