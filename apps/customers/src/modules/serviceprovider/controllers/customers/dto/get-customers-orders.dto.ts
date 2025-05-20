import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BasePaginationQuery, TransformObjectId } from '@instapets-backend/common';
import { IsInstance, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class GetCustomersOrdersQueryDto extends BasePaginationQuery {
  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiPropertyOptional({ type: String })
  branchId?: Types.ObjectId;
}
