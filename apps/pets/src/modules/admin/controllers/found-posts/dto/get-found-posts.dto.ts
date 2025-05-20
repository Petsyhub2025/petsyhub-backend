import { BaseSearchPaginationQuery } from '@common/dtos';
import {
  FoundPostAdminSortByEnum,
  FoundPostAdminSortOrderEnum,
  IsDateFromTimestamp,
  TransformTimeStamp,
} from '@instapets-backend/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetFoundPostsQueryDto extends BaseSearchPaginationQuery {
  @IsMongoId()
  @IsOptional()
  authorUserId?: string;

  @IsMongoId()
  @IsOptional()
  cityId?: string;

  @IsMongoId()
  @IsOptional()
  countryId?: string;

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
  @IsEnum(FoundPostAdminSortByEnum)
  sortBy?: FoundPostAdminSortByEnum = FoundPostAdminSortByEnum.FOUND_DATE;

  @IsOptional()
  @IsNumber()
  @IsEnum(FoundPostAdminSortOrderEnum)
  sortOrder?: FoundPostAdminSortOrderEnum = FoundPostAdminSortOrderEnum.DESC;
}
