import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsInstance, IsOptional, ValidateIf } from 'class-validator';
import { Types } from 'mongoose';

export class PetUser {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  userId: Types.ObjectId;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  country?: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ValidateIf((o) => !!o.country)
  city?: Types.ObjectId;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  area?: Types.ObjectId;
}
