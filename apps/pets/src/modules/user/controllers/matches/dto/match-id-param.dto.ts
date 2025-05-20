import { TransformObjectId } from '@instapets-backend/common';
import { IsInstance } from 'class-validator';
import { Types } from 'mongoose';

export class MatchIdParamDto {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  matchId: Types.ObjectId;
}
