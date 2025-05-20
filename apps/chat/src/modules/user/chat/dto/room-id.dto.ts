import { TransformObjectId } from '@instapets-backend/common';
import { IsInstance } from 'class-validator';
import { Types } from 'mongoose';

export class RoomIdDto {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  roomId: Types.ObjectId;
}
