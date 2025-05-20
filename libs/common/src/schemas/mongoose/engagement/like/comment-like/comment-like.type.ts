import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsInstance } from 'class-validator';
import { Model, Types } from 'mongoose';
import { BaseLike, IBaseLikeInstanceMethods } from '../base-like';

export class CommentLike extends BaseLike {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  comment: Types.ObjectId;
}

export interface ICommentLikeInstanceMethods extends IBaseLikeInstanceMethods {}
export interface ICommentLikeModel extends Model<CommentLike, Record<string, unknown>, ICommentLikeInstanceMethods> {}
