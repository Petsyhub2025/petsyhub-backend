import { Model, Types } from 'mongoose';
import { BaseLostFoundPost, IBaseLostFoundPostInstanceMethods } from '../base-lost-found-post.type';
import { IsBoolean, IsInstance, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { TransformObjectId } from '@common/decorators/class-transformer';

export class LostPost extends BaseLostFoundPost {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  pet: Types.ObjectId;

  @IsOptional()
  @IsNumber()
  @Max(999999)
  @Min(100)
  reward?: number;

  @IsOptional()
  @IsBoolean()
  isFound?: boolean;
}

export interface ILostPostInstanceMethods extends IBaseLostFoundPostInstanceMethods {}
export interface ILostPostModel extends Model<LostPost, Record<string, unknown>, ILostPostInstanceMethods> {}
