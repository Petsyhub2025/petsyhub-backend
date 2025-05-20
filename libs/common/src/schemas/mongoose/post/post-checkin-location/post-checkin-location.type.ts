import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsInstance } from 'class-validator';
import { Types } from 'mongoose';

export class PostCheckInLocation {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  country: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  city: Types.ObjectId;
}
