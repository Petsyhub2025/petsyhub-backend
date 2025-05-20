import { TransformObjectId } from '@instapets-backend/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInstance, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class GetPricedProductDetailsDto {
  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiPropertyOptional({ type: String })
  shopId?: Types.ObjectId;
}
