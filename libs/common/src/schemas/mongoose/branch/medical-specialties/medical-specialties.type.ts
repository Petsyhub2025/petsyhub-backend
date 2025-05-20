import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { LocalizedText } from '@common/schemas/mongoose/common/localized-text';
import { IsObject, ValidateNested } from 'class-validator';
import { Model } from 'mongoose';

export class MedicalSpecialty extends BaseModel<MedicalSpecialty> {
  @IsObject()
  @ValidateNested()
  name: LocalizedText;
}

export interface IMedicalSpecialtyInstanceMethods extends IBaseInstanceMethods {}
export interface IMedicalSpecialtyModel
  extends Model<MedicalSpecialty, Record<string, unknown>, IMedicalSpecialtyInstanceMethods> {}
