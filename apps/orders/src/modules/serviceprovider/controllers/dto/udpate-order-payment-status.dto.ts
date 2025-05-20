import { PaymentStatusEnum, TransformObjectId } from '@instapets-backend/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsInstance, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateOrderPaymentStatusDto {
  @IsString()
  status: PaymentStatusEnum;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  branchId: Types.ObjectId;
}
