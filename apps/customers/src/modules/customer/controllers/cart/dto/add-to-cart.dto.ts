import { TransformObjectId } from '@instapets-backend/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsInstance, IsNumber, IsString, Min } from 'class-validator';
import { Types } from 'mongoose';

export enum CartActionEnum {
  ADD = 'ADD',
  INCREMENT = 'INCREMENT',
  DECREMENT = 'DECREMENT',
}
export class AddToCartDto {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  productId: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  shopId: Types.ObjectId;

  @IsNumber()
  @Min(1)
  @ApiProperty({ type: Number })
  quantity: number;

  @IsString()
  action: CartActionEnum;
}
