import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsInstance, IsOptional, IsBoolean, IsObject, ValidateNested } from 'class-validator';
import { Types, Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { PointLocation } from '@common/schemas/mongoose/common/point';

export class UserAddress extends BaseModel<UserAddress> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  country: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  city: Types.ObjectId;

  @IsOptional()
  @IsBoolean()
  isPendingAddress?: boolean;

  @IsObject()
  @ValidateNested()
  location: PointLocation;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  user: Types.ObjectId;
}

export interface IUserAddressInstanceMethods extends IBaseInstanceMethods {}
export interface IUserAddressModel extends Model<UserAddress, Record<string, unknown>, IUserAddressInstanceMethods> {}
