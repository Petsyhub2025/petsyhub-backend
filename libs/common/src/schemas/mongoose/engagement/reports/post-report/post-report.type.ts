import { IsInstance } from 'class-validator';
import { BaseReport, IBaseReportInstanceMethods } from '../base-report';
import { Model, Types } from 'mongoose';
import { TransformObjectId } from '@common/decorators/class-transformer';

export class PostReport extends BaseReport {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  post: Types.ObjectId;
}
export interface IPostReportInstanceMethods extends IBaseReportInstanceMethods {}
export interface IPostReportModel extends Model<PostReport, Record<string, unknown>, IPostReportInstanceMethods> {}
