import { BasePaginationQuery } from '@common/dtos';
import { TransformObjectId, TransformObjectIds } from '@instapets-backend/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInstance, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class GetProductsDto extends BasePaginationQuery {
  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiPropertyOptional({ type: String })
  supplierId?: Types.ObjectId;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiPropertyOptional({ type: String })
  branchId?: string;

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
