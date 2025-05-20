import { TransformObjectId } from '@instapets-backend/common';
import { IsInstance } from 'class-validator';
import { Types } from 'mongoose';

export class BrandIdQueryDto {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  brandId: Types.ObjectId;
}
