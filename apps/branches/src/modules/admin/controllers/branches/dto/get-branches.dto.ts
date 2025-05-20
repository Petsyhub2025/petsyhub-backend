import { BaseSearchPaginationQuery } from '@common/dtos';
import {
  BranchStatusEnum,
  BranchTypeEnum,
  IsDateFromTimestamp,
  TransformObjectId,
  TransformTimeStamp,
} from '@instapets-backend/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInstance, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export enum DateFilterType {
  JOINING_DATE = 'createdAt',
  ACTIVATION_DATE = 'approvedAt',
  REJECTED_DATE = 'rejectedAt',
  SUSPENSION_DATE = 'suspendedAt',
}
export class GetBranchesDto extends BaseSearchPaginationQuery {
  @IsOptional()
  @IsString()
  @IsEnum(BranchStatusEnum)
  @ApiPropertyOptional({ type: BranchStatusEnum })
  status?: BranchStatusEnum;

  @IsOptional()
  @IsString()
  @IsEnum(BranchTypeEnum)
  @ApiPropertyOptional({ type: BranchTypeEnum })
  branchType?: BranchTypeEnum;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiPropertyOptional({ type: 'string' })
  country?: Types.ObjectId;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiPropertyOptional({ type: 'string' })
  city?: Types.ObjectId;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiPropertyOptional({ type: 'string' })
  area?: Types.ObjectId;

  @IsOptional()
  @IsDateFromTimestamp()
  @TransformTimeStamp()
  @ApiPropertyOptional({ type: 'number' })
  dateFrom?: Date;

  @IsOptional()
  @IsDateFromTimestamp()
  @TransformTimeStamp()
  @ApiPropertyOptional({ type: 'number' })
  dateTo?: Date;

  @IsOptional()
  @IsString()
  @IsEnum(DateFilterType)
  @ApiPropertyOptional({ type: DateFilterType })
  dateFilterType?: DateFilterType;
}
