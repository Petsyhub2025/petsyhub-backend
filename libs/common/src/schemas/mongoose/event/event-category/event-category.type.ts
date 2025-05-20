import { IsObject, ValidateNested } from 'class-validator';
import { Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { LocalizedText } from '@common/schemas/mongoose/common/localized-text';

export class EventCategory extends BaseModel<EventCategory> {
  @IsObject()
  @ValidateNested()
  name: LocalizedText;
}

export interface IEventCategoryInstanceMethods extends IBaseInstanceMethods {}
export interface IEventCategoryModel
  extends Model<EventCategory, Record<string, unknown>, IEventCategoryInstanceMethods> {}
