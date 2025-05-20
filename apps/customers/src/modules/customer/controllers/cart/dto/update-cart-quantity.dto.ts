import { TransformObjectId } from '@instapets-backend/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInstance, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateProductQuantityInCartDto {
  @IsString()
  @IsIn(['inc', 'dec'])
  action: string;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  shopId: Types.ObjectId;
}
