import { IsInstance } from 'class-validator';
import { RoomIdDto } from './room-id.dto';
import { TransformObjectId } from '@instapets-backend/common';
import { Types } from 'mongoose';

export class MarkAsReadDto extends RoomIdDto {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  lastMessageId: string;
}
