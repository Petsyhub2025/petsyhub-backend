import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsObject, ValidateNested, IsInstance } from 'class-validator';
import { Types, Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { LocalizedText } from '@common/schemas/mongoose/common/localized-text';
import { PointLocation } from '@common/schemas/mongoose/common/point';

export class City extends BaseModel<City> {
  @IsObject()
  @ValidateNested()
  name: LocalizedText;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  country: Types.ObjectId;

  @IsObject()
  @ValidateNested()
  location: PointLocation;
}

export interface ICityInstanceMethods extends IBaseInstanceMethods {}
export interface ICityModel extends Model<City, Record<string, unknown>, ICityInstanceMethods> {}
