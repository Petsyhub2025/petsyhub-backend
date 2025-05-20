import { Model, Types } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { IsInstance } from 'class-validator';
import { TransformObjectId } from '@common/decorators/class-transformer';

export class UserTopic extends BaseModel<UserTopic> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  user: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  topic: Types.ObjectId;
}

export interface IUserTopicInstanceMethods extends IBaseInstanceMethods {}
export interface IUserTopicModel extends Model<UserTopic, Record<string, unknown>, IUserTopicInstanceMethods> {}
