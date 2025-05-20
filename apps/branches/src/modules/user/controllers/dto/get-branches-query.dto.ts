import { BasePaginationQuery, BranchTypeEnum } from '@instapets-backend/common';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class GetBranchesQueryDto extends BasePaginationQuery {
  @IsOptional()
  @IsString()
  @IsEnum(BranchTypeEnum)
  branchType?: BranchTypeEnum;

  @IsNumber()
  @IsLatitude()
  @ValidateIf((o) => o.lng !== undefined)
  @Type(() => Number)
  lat: number;

  @IsNumber()
  @IsLongitude()
  @ValidateIf((o) => o.latitude !== undefined)
  @Type(() => Number)
  lng: number;

  @IsOptional()
  @IsMongoId()
  brandId?: string;
}
