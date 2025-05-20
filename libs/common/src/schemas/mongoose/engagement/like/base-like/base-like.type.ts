import { IsEnum, IsInstance, IsString } from 'class-validator';
import { Model, Types } from 'mongoose';
import { LikeType } from './base-like.enum';
import { TransformObjectId } from '@common/decorators/class-transformer';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';

export class BaseLike extends BaseModel<BaseLike> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  authorUser: Types.ObjectId;

  @IsString()
  @IsEnum(LikeType)
  likeType: LikeType;
}

export interface IBaseLikeInstanceMethods extends IBaseInstanceMethods {}
export interface IBaseLikeModel extends Model<BaseLike, Record<string, unknown>, IBaseLikeInstanceMethods> {}
