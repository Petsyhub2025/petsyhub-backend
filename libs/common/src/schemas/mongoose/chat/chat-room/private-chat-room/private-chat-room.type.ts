import { ArrayMaxSize, ArrayMinSize, IsArray } from 'class-validator';
import { Model, Types } from 'mongoose';
import { BaseChatRoom, IBaseChatRoomInstanceMethods } from '../base-chat-room';
import { TransformObjectIds } from '@common/decorators/class-transformer';

export class PrivateChatRoom extends BaseChatRoom {
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsArray()
  @TransformObjectIds()
  participants: Types.ObjectId[];
}

export interface IPrivateChatRoomInstanceMethods extends IBaseChatRoomInstanceMethods {}
export interface IPrivateChatRoomModel
  extends Model<PrivateChatRoom, Record<string, unknown>, IPrivateChatRoomInstanceMethods> {}
