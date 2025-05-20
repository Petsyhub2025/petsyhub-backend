import { BaseSearchPaginationQuery } from '@common/dtos';
import {
  IsDateFromTimestamp,
  LostPostAdminSortByEnum,
  LostPostAdminSortOrderEnum,
  TransformTimeStamp,
} from '@instapets-backend/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetLostPostsQueryDto extends BaseSearchPaginationQuery {
  @IsMongoId()
  @IsOptional()
  authorUserId?: string;

  @IsMongoId()
  @IsOptional()
  petId?: string;

  @IsMongoId()
  @IsOptional()
  cityId?: string;

  @IsMongoId()
  @IsOptional()
  countryId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ obj, key }) => obj[key] === 'true')
  isFound?: boolean;

  @IsOptional()
  @IsDateFromTimestamp()
  @TransformTimeStamp()
  @ApiProperty({ type: Number })
  dateFrom?: Date;

  @IsOptional()
  @IsDateFromTimestamp()
  @TransformTimeStamp()
  @ApiProperty({ type: Number })
  dateTo?: Date;

  @IsOptional()
  @IsString()
  @IsEnum(LostPostAdminSortByEnum)
  sortBy?: LostPostAdminSortByEnum = LostPostAdminSortByEnum.CREATED_DATE;

  @IsOptional()
  @IsNumber()
  @IsEnum(LostPostAdminSortOrderEnum)
  sortOrder?: LostPostAdminSortOrderEnum = LostPostAdminSortOrderEnum.DESC;
}
