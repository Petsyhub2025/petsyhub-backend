import { IsInstance } from 'class-validator';
import { BaseReport, IBaseReportInstanceMethods } from '../base-report';
import { Model, Types } from 'mongoose';
import { TransformObjectId } from '@common/decorators/class-transformer';

export class CommentReport extends BaseReport {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  comment: Types.ObjectId;
}
export interface ICommentReportInstanceMethods extends IBaseReportInstanceMethods {}
export interface ICommentReportModel
  extends Model<CommentReport, Record<string, unknown>, ICommentReportInstanceMethods> {}
