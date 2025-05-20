import { IsDate, IsEnum, IsInstance, IsOptional, IsString, ValidateIf } from 'class-validator';
import { Model, Types } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { TransformObjectId } from '@common/decorators/class-transformer';
import {
  UserChatRoomRelationChatRequestStatusEnum,
  UserChatRoomRelationRoleEnum,
  UserChatRoomRelationStatusEnum,
} from './user-chat-room-relation.enum';

export class UserChatRoomRelation extends BaseModel<UserChatRoomRelation> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  user: Types.ObjectId;

  @IsOptional()
  @IsString()
  @IsEnum(UserChatRoomRelationRoleEnum)
  role?: UserChatRoomRelationRoleEnum;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  room: Types.ObjectId;

  @IsString()
  @IsEnum(UserChatRoomRelationStatusEnum)
  status: UserChatRoomRelationStatusEnum;

  @IsDate()
  lastJoinDate: Date;

  @IsDate()
  @IsOptional()
  lastLeaveDate?: Date;

  @IsDate()
  @IsOptional()
  lastMessageClearDate?: Date;

  @IsDate()
  @IsOptional()
  lastMessageSeenDate?: Date;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  lastMessageSeenId?: Types.ObjectId;

  @IsDate()
  @IsOptional()
  messageFilterStartDate?: Date;

  @ValidateIf((o) => o.chatRequesterId)
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  chatRequesterId?: Types.ObjectId;

  @IsString()
  @IsEnum(UserChatRoomRelationChatRequestStatusEnum)
  chatRequestStatus?: UserChatRoomRelationChatRequestStatusEnum;
}

export interface IUserChatRoomRelationInstanceMethods extends IBaseInstanceMethods {}
export interface IUserChatRoomRelationModel
  extends Model<UserChatRoomRelation, Record<string, unknown>, IUserChatRoomRelationInstanceMethods> {}
