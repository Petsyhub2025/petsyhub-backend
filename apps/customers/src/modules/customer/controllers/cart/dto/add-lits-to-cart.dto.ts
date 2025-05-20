import { TransformObjectId } from '@instapets-backend/common';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInstance, IsNumber, Min } from 'class-validator';
import { Types } from 'mongoose';

export class CartItemDto {
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
}
export class AddListToCartDto {
  @IsArray()
  @ArrayNotEmpty()
  cartItems: CartItemDto[];
}
