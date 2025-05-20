import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsInstance } from 'class-validator';
import { BaseReport, IBaseReportInstanceMethods } from '../base-report';
import { Model, Types } from 'mongoose';

export class CommentReplyReport extends BaseReport {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  commentReply: Types.ObjectId;
}
export interface ICommentReplyReportInstanceMethods extends IBaseReportInstanceMethods {}
export interface ICommentReplyReportModel
  extends Model<CommentReplyReport, Record<string, unknown>, ICommentReplyReportInstanceMethods> {}
