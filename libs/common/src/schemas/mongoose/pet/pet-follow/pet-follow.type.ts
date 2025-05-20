import { IsInstance } from 'class-validator';
import { Model, Types } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { TransformObjectId } from '@common/decorators/class-transformer';

export class PetFollow extends BaseModel<PetFollow> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  follower: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  following: Types.ObjectId;
}

export interface IPetFollowInstanceMethods extends IBaseInstanceMethods {}
export interface IPetFollowModel extends Model<PetFollow, Record<string, unknown>, IPetFollowInstanceMethods> {}
