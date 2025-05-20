import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsInstance, IsObject, ValidateNested } from 'class-validator';
import { Model, Types } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '../base/base-schema';
import { LocalizedText } from '../common/localized-text';
import { PointLocation } from '../common/point';

export class Area extends BaseModel<Area> {
  @IsObject()
  @ValidateNested()
  name: LocalizedText;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  city: Types.ObjectId;

  @IsObject()
  @ValidateNested()
  location: PointLocation;
}

export interface IAreaInstanceMethods extends IBaseInstanceMethods {}
export interface IAreaModel extends Model<Area, Record<string, unknown>, IAreaInstanceMethods> {}
