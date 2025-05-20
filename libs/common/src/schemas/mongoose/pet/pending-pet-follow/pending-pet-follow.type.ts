import { IsInstance } from 'class-validator';
import { Model, Types } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { TransformObjectId } from '@common/decorators/class-transformer';

export class PendingPetFollow extends BaseModel<PendingPetFollow> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  follower: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  following: Types.ObjectId;
}

export interface IPendingPetFollowInstanceMethods extends IBaseInstanceMethods {}
export interface IPendingPetFollowModel
  extends Model<PendingPetFollow, Record<string, unknown>, IPendingPetFollowInstanceMethods> {}
