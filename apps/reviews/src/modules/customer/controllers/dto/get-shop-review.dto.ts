import { BasePaginationQuery } from '@common/dtos';
import { TransformObjectId } from '@instapets-backend/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsInstance } from 'class-validator';
import { Types } from 'mongoose';

export class GetShopReviewsDto extends BasePaginationQuery {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  shopId: Types.ObjectId;
}
