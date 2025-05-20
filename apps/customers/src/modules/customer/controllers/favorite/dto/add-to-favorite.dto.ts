import { FavoriteTypeEnum, TransformObjectId } from '@instapets-backend/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInstance, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class AddToFavoriteDto {
  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiPropertyOptional({ type: String })
  productId?: Types.ObjectId;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiPropertyOptional({ type: String })
  shopId?: Types.ObjectId;

  @IsString()
  favoriteType: FavoriteTypeEnum;
}
