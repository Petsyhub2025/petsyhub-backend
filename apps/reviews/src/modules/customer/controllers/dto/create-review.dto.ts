import { TransformObjectId } from '@instapets-backend/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsInstance, IsNumber, IsString, Max, Min, MinLength } from 'class-validator';
import { Types } from 'mongoose';

export class CreateReviewDto {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  shopId: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  orderId: Types.ObjectId;

  @IsNumber()
  @Min(0)
  @Max(5)
  @ApiProperty({ type: Number })
  rating: number;

  @IsString()
  @MinLength(10)
  @ApiProperty({ type: String })
  text: string;
}
