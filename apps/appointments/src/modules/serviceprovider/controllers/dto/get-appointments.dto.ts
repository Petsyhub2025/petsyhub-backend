import {
  BasePaginationQuery,
  IsDateFromTimestamp,
  TransformObjectId,
  TransformObjectIds,
  TransformTimeStamp,
} from '@instapets-backend/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDate, IsEnum, IsInstance, IsOptional, IsString, MaxDate } from 'class-validator';
import { Types } from 'mongoose';

export enum AppointmentsStatusEnumDto {
  PENDING = 'pending',
  UPCOMING = 'upcoming',
  HISTORY = 'history',
}
export class GetAppointmentsDto extends BasePaginationQuery {
  @IsString()
  @IsEnum(AppointmentsStatusEnumDto)
  @ApiProperty({ type: AppointmentsStatusEnumDto })
  status: AppointmentsStatusEnumDto;

  @IsOptional()
  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @ApiProperty({ type: [String] })
  petTypes?: Types.ObjectId[];

  @IsOptional()
  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @ApiProperty({ type: [String] })
  services?: Types.ObjectId[];

  @IsOptional()
  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @ApiProperty({ type: [String] })
  medicalSpecialties?: Types.ObjectId[];

  @IsOptional()
  @IsDateFromTimestamp()
  @MaxDate(new Date(4133023200000)) // 2100-01-01
  @TransformTimeStamp()
  @ApiProperty({ type: 'number' })
  date?: Date;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  branch: Types.ObjectId;
}
