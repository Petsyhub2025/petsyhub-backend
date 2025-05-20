import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsInstance } from 'class-validator';
import { Types, Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';

export class UserFollow extends BaseModel<UserFollow> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  follower: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  following: Types.ObjectId;
}

export interface IUserFollowInstanceMethods extends IBaseInstanceMethods {}
export interface IUserFollowModel extends Model<UserFollow, Record<string, unknown>, IUserFollowInstanceMethods> {}
