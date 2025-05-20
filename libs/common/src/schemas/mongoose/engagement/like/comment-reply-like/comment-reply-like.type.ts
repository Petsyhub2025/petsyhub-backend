import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsInstance } from 'class-validator';
import { Model, Types } from 'mongoose';
import { BaseLike, IBaseLikeInstanceMethods } from '../base-like';

export class CommentReplyLike extends BaseLike {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  commentReply: Types.ObjectId;
}

export interface ICommentReplyLikeInstanceMethods extends IBaseLikeInstanceMethods {}
export interface ICommentReplyLikeModel
  extends Model<CommentReplyLike, Record<string, unknown>, ICommentReplyLikeInstanceMethods> {}
