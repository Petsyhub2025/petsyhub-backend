import { TransformObjectIds } from '@instapets-backend/common';
import { IsArray, IsInstance, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class GetUpcomingAppointmentsDto {
  @IsOptional()
  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  clinicBranches?: Types.ObjectId[];
}
