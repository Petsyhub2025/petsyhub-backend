import { BasePaginationQuery } from '@common/dtos';
import { TransformObjectId } from '@instapets-backend/common';
import { IsInstance, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class GetProductsDto extends BasePaginationQuery {
  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  supplierId?: Types.ObjectId;
}
