import { IsInstance } from 'class-validator';
import { BaseReport, IBaseReportInstanceMethods } from '../base-report';
import { Model, Types } from 'mongoose';
import { TransformObjectId } from '@common/decorators/class-transformer';

export class UserReport extends BaseReport {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  user: Types.ObjectId;
}
export interface IUserReportInstanceMethods extends IBaseReportInstanceMethods {}
export interface IUserReportModel extends Model<UserReport, Record<string, unknown>, IUserReportInstanceMethods> {}
