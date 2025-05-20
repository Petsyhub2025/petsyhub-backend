import { ApiProperty, PickType } from '@nestjs/swagger';
import {
  ClinicAppointment,
  IsDateAfterNow,
  IsDateFromTimestamp,
  TransformObjectId,
  TransformObjectIds,
  TransformTimeStamp,
} from '@instapets-backend/common';
import { ArrayNotEmpty, IsArray, IsInstance, MaxDate } from 'class-validator';
import { Types } from 'mongoose';

export class CreateAppointmentDto extends PickType(ClinicAppointment, [
  'petHealthDescription',
  'phoneNumber',
] as const) {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  selectedPetId: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  branchId: Types.ObjectId;

  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @ArrayNotEmpty()
  @ApiProperty({ type: [String] })
  selectedServices: Types.ObjectId[];

  @IsArray()
  @ArrayNotEmpty()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @ApiProperty({ type: [String] })
  medicalSpecialties: Types.ObjectId[];

  @IsDateFromTimestamp()
  @IsDateAfterNow()
  @MaxDate(new Date(4133023200000)) // 2100-01-01
  @TransformTimeStamp()
  @ApiProperty({ type: 'number' })
  date: Date;
}
