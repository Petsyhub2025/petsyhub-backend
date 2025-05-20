import { TransformObjectId } from '@instapets-backend/common';
import { IsInstance } from 'class-validator';
import { Types } from 'mongoose';
import { RoomIdDto } from './room-id.dto';

export class GetParticipantDataDto extends RoomIdDto {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  participantId: Types.ObjectId;
}
