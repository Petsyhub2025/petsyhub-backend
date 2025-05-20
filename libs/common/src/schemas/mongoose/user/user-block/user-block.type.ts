import { IsInstance } from 'class-validator';
import { Model, Types } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { TransformObjectId } from '@common/decorators/class-transformer';

export class UserBlock extends BaseModel<UserBlock> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  blocker: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  blocked: Types.ObjectId;
}

export interface IUserBlockInstanceMethods extends IBaseInstanceMethods {}
export interface IUserBlockModel extends Model<UserBlock, Record<string, unknown>, IUserBlockInstanceMethods> {}
