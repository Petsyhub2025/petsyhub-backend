import { TransformObjectIds } from '@instapets-backend/common';
import { IsArray, IsDate, IsInstance, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class GetAppointmentsStatusCountDto {
  @IsOptional()
  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  petTypes?: Types.ObjectId[];

  @IsOptional()
  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  services?: Types.ObjectId[];

  @IsOptional()
  @IsDate()
  date?: Date;

  @IsOptional()
  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  clinicBranches?: Types.ObjectId[];
}
