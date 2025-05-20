import { IsBoolean, IsDate, IsEnum, IsString } from 'class-validator';
import { WorkingDays } from '@common/schemas/mongoose/branch/subschemas/schedule/schedule.enum';

export class ScheduleType {
  @IsString()
  @IsEnum(WorkingDays)
  day: WorkingDays;

  @IsDate()
  startTime: Date;

  @IsDate()
  endTime: Date;

  @IsBoolean()
  isActive: boolean;
}
