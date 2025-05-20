import { IsEnum, IsString } from 'class-validator';
import { Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { ChatRoomType } from './base-chat-room.enum';

export class BaseChatRoom extends BaseModel<BaseChatRoom> {
  @IsString()
  @IsEnum(ChatRoomType)
  chatRoomType: ChatRoomType;
}

export interface IBaseChatRoomInstanceMethods extends IBaseInstanceMethods {}
export interface IBaseChatRoomModel
  extends Model<BaseChatRoom, Record<string, unknown>, IBaseChatRoomInstanceMethods> {}
