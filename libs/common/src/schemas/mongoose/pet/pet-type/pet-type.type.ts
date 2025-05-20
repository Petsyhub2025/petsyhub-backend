import { IsObject, ValidateNested } from 'class-validator';
import { Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { LocalizedText } from '@common/schemas/mongoose/common/localized-text';

export class PetType extends BaseModel<PetType> {
  @IsObject()
  @ValidateNested()
  name: LocalizedText;
}

export interface IPetTypeInstanceMethods extends IBaseInstanceMethods {}
export interface IPetTypeModel extends Model<PetType, Record<string, unknown>, IPetTypeInstanceMethods> {}
