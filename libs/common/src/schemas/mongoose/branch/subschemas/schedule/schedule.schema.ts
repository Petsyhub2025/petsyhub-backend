import { Schema } from 'mongoose';
import { ScheduleType } from './schedule.type';
import { WorkingDays } from '@common/schemas/mongoose/branch/subschemas/schedule/schedule.enum';

export const ScheduleSubSchema = new Schema<ScheduleType>(
  {
    day: { type: String, enum: WorkingDays, required: true },
    endTime: { type: Date, required: true },
    isActive: { type: Boolean, required: true },
    startTime: { type: Date, required: true },
  },
  {
    _id: false,
    timestamps: false,
  },
);
