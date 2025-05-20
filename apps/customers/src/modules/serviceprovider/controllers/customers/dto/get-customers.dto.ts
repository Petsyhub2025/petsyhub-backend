import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseSearchPaginationQuery, TransformObjectId } from '@instapets-backend/common';
import { IsInstance, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class GetCustomersQueryDto extends BaseSearchPaginationQuery {
  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiPropertyOptional({ type: String })
  branchId?: Types.ObjectId;
}
