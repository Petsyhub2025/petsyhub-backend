import { TransformObjectId } from '@common/decorators/class-transformer';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { IsInstance, IsOptional, IsString } from 'class-validator';
import { Model, Types } from 'mongoose';
import { FavoriteTypeEnum } from './favorite.enum';

export class Favorite extends BaseModel<Favorite> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  customer: Types.ObjectId;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  shop?: Types.ObjectId;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  product?: Types.ObjectId;

  @IsString()
  favoriteType: FavoriteTypeEnum;
}
export interface IFavoriteInstanceMethods extends IBaseInstanceMethods {}
export interface IFavoriteModel extends Model<Favorite, Record<string, unknown>, IFavoriteInstanceMethods> {}
