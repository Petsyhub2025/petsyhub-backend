import { OrderStatusEnum, TransformObjectId } from '@instapets-backend/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInstance, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateOrderStatusDto {
  @IsString()
  @IsEnum(OrderStatusEnum)
  @ApiProperty({ type: String, enum: OrderStatusEnum })
  status: OrderStatusEnum;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  branchId: Types.ObjectId;
}
