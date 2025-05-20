import { IsInstance } from 'class-validator';
import { Model, Types } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { TransformObjectId } from '@common/decorators/class-transformer';

export class PendingUserFollow extends BaseModel<PendingUserFollow> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  follower: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  following: Types.ObjectId;
}

export interface IPendingUserFollowInstanceMethods extends IBaseInstanceMethods {}
export interface IPendingUserFollowModel
  extends Model<PendingUserFollow, Record<string, unknown>, IPendingUserFollowInstanceMethods> {}
