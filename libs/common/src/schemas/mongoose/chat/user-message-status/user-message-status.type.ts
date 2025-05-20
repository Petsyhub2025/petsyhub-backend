import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsInstance, IsOptional } from 'class-validator';
import { Model, Types } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';

export class UserMessageStatus extends BaseModel<UserMessageStatus> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  user: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  room: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  message: Types.ObjectId;

  @IsOptional()
  isRead?: boolean;
}

export interface IUserMessageStatusInstanceMethods extends IBaseInstanceMethods {}
export interface IUserMessageStatusModel
  extends Model<UserMessageStatus, Record<string, unknown>, IUserMessageStatusInstanceMethods> {}
