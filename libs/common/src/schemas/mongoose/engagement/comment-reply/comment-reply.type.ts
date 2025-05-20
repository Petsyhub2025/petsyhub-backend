import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsDate, IsInstance, IsNumber, IsOptional, IsString } from 'class-validator';
import { Model, Types } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';

export class CommentReply extends BaseModel<CommentReply> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  authorUser: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  post: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  replyOn: Types.ObjectId;

  @IsString()
  body: string;

  @IsOptional()
  @IsNumber()
  totalLikes?: number;

  @IsOptional()
  @IsNumber()
  totalReports?: number;

  @IsOptional()
  @IsDate()
  suspendedDueToCommentSuspensionAt?: Date;
}

export interface ICommentReplyInstanceMethods extends IBaseInstanceMethods {
  suspendDocDueToCommentSuspension: () => Promise<void>;
  unSuspendDocDueToCommentSuspension: () => Promise<void>;
}
export interface ICommentReplyModel
  extends Model<CommentReply, Record<string, unknown>, ICommentReplyInstanceMethods> {}
