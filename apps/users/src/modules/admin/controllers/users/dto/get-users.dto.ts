import { ApiProperty } from '@nestjs/swagger';
import {
  BaseSearchPaginationQuery,
  IsDateFromTimestamp,
  TransformObjectId,
  TransformTimeStamp,
  UserAdminSortByEnum,
  UserAdminSortOrderEnum,
  UserRoleEnum,
} from '@instapets-backend/common';
import { IsEnum, IsInstance, IsNumber, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class GetUsersQueryDto extends BaseSearchPaginationQuery {
  @IsOptional()
  @IsDateFromTimestamp()
  @TransformTimeStamp()
  @ApiProperty({ type: Number })
  joinDateFrom?: Date;

  @IsOptional()
  @IsDateFromTimestamp()
  @TransformTimeStamp()
  @ApiProperty({ type: Number })
  joinDateTo?: Date;

  @IsOptional()
  @IsString()
  @IsEnum(UserRoleEnum)
  role?: UserRoleEnum;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  countryId?: Types.ObjectId;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  cityId?: Types.ObjectId;

  @IsOptional()
  @IsString()
  @IsEnum(UserAdminSortByEnum)
  sortBy?: UserAdminSortByEnum = UserAdminSortByEnum.JOIN_DATE;

  @IsOptional()
  @IsNumber()
  @IsEnum(UserAdminSortOrderEnum)
  sortOrder?: UserAdminSortOrderEnum = UserAdminSortOrderEnum.DESC;
}
