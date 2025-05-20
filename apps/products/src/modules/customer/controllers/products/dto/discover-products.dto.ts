import { BasePaginationQuery } from '@common/dtos';
import { TransformObjectIds } from '@instapets-backend/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInstance, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class DiscoverAllProductsDto extends BasePaginationQuery {
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
}
