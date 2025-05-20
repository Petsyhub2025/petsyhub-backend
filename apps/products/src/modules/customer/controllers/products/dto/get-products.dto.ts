import { BasePaginationQuery } from '@common/dtos';
import { TransformObjectId, TransformObjectIds } from '@instapets-backend/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInstance, IsLatitude, IsLongitude, IsNumber, IsOptional, ValidateIf } from 'class-validator';
import { Types } from 'mongoose';

export class GetAllProductsDto extends BasePaginationQuery {
  @IsOptional()
  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @ApiPropertyOptional({ type: [String] })
  categories?: Types.ObjectId[];

  @IsOptional()
  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @ApiPropertyOptional({ type: [String] })
  subCategories?: Types.ObjectId[];

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  shopId: Types.ObjectId;

  @IsOptional()
  @IsNumber()
  @IsLatitude()
  @ValidateIf((o) => o.lng !== undefined)
  @Type(() => Number)
  @ApiPropertyOptional({ type: Number, example: 31.20402532134119 })
  lat?: number;

  @IsOptional()
  @IsNumber()
  @IsLongitude()
  @ValidateIf((o) => o.latitude !== undefined)
  @Type(() => Number)
  @ApiPropertyOptional({ type: Number, example: 29.910899667675583 })
  lng?: number;
}
