import { BasePaginationQuery, TransformObjectIds } from '@instapets-backend/common';
import { IsArray, IsDate, IsInstance, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class GetUpcomingAppointmentsListDto extends BasePaginationQuery {
  @IsDate()
  date: Date;

  @IsOptional()
  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  clinicBranches?: Types.ObjectId[];
}
