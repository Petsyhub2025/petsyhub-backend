import { IsObject, IsOptional, IsString, IsUUID, IsUrl, ValidateNested } from 'class-validator';
import { Model } from 'mongoose';
import { BaseChatRoom, IBaseChatRoomInstanceMethods } from '@common/schemas/mongoose/chat/chat-room/base-chat-room';
import { Media } from '@common/schemas/mongoose/common/media';

export class GroupChatRoom extends BaseChatRoom {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  roomPictureMedia?: Media;

  @IsOptional()
  @IsUUID()
  roomPictureMediaProcessingId?: string;
}

export interface IGroupChatRoomInstanceMethods extends IBaseChatRoomInstanceMethods {}
export interface IGroupChatRoomModel
  extends Model<GroupChatRoom, Record<string, unknown>, IGroupChatRoomInstanceMethods> {}
