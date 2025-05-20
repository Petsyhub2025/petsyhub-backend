import { IsObject, ValidateNested } from 'class-validator';
import { Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { LocalizedText } from '@common/schemas/mongoose/common/localized-text';

export class EventFacility extends BaseModel<EventFacility> {
  @IsObject()
  @ValidateNested()
  name: LocalizedText;
}

export interface IEventFacilityInstanceMethods extends IBaseInstanceMethods {}
export interface IEventFacilityModel
  extends Model<EventFacility, Record<string, unknown>, IEventFacilityInstanceMethods> {}
