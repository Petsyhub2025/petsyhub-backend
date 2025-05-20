import { IsInstance, IsMongoId } from 'class-validator';
import { Model, Types } from 'mongoose';
import { BaseLike, IBaseLikeInstanceMethods } from '../base-like';
import { TransformObjectId } from '@common/decorators/class-transformer';

export class PostLike extends BaseLike {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  post: Types.ObjectId;
}

export interface IPostLikeInstanceMethods extends IBaseLikeInstanceMethods {}
export interface IPostLikeModel extends Model<PostLike, Record<string, unknown>, IPostLikeInstanceMethods> {}
