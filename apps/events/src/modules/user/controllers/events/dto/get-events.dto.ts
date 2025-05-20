import {
  BasePaginationQuery,
  EventTypeEnum,
  IsDateFromTimestamp,
  TransformArray,
  TransformObjectId,
  TransformObjectIds,
  TransformTimeStamp,
} from '@instapets-backend/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsEnum, IsInstance, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class GetEventsQueryDto extends BasePaginationQuery {
  @IsOptional()
  @IsString()
  @IsEnum(EventTypeEnum)
  type?: EventTypeEnum;

  @IsOptional()
  @IsDateFromTimestamp()
  @TransformTimeStamp()
  @ApiPropertyOptional({ type: 'number' })
  startDate: Date;

  @IsOptional()
  @IsDateFromTimestamp()
  @TransformTimeStamp()
  @ApiPropertyOptional({ type: 'number' })
  endDate: Date;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  cityId?: Types.ObjectId;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @TransformArray()
  @ApiProperty({ type: [String] })
  petTypeIds?: Types.ObjectId[];
}
