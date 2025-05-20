import { TransformObjectId } from '@instapets-backend/common';
import { IsInstance } from 'class-validator';
import { Types } from 'mongoose';

export class ProcessUserPushNotificationDto {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  userPushNotificationId: Types.ObjectId;
}
