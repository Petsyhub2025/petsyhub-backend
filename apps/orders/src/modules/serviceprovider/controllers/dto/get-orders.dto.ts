import { BasePaginationQuery, OrderStatusEnum, TransformObjectId } from '@instapets-backend/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInstance, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class GetOrdersDto extends BasePaginationQuery {
  @IsOptional()
  @IsString()
  status?: OrderStatusEnum;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiPropertyOptional({ type: String })
  branchId?: Types.ObjectId;
}
