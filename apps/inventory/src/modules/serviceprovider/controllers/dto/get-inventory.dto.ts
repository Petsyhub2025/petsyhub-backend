import { BaseSearchPaginationQuery } from '@common/dtos';
import { TransformObjectId, TransformObjectIds } from '@instapets-backend/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInstance, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class GetInventoryDto extends BaseSearchPaginationQuery {
  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiPropertyOptional({ type: String })
  branchId?: Types.ObjectId;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiPropertyOptional({ type: String })
  supplierId?: Types.ObjectId;

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
