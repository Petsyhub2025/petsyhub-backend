import { BasePaginationQuery } from '@common/dtos';
import { TransformObjectId } from '@instapets-backend/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInstance, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class GetProductCategoriesQueryDto extends BasePaginationQuery {
  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiPropertyOptional({ type: String })
  branchId?: string;
}
