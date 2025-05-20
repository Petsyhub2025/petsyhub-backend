import { TransformObjectId } from '@instapets-backend/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsInstance, IsNumber, Min } from 'class-validator';
import { Types } from 'mongoose';

export class AddProductToInventoryDto {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  productId: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  branchId: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  brandId: Types.ObjectId;

  @IsNumber()
  @Min(0)
  @ApiProperty({ type: Number })
  quantity: number;

  @IsNumber()
  @Min(0)
  @ApiProperty({ type: Number })
  price: number;
}
