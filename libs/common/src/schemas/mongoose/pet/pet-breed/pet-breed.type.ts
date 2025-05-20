import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsInstance, IsObject, ValidateNested } from 'class-validator';
import { Types, Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { LocalizedText } from '@common/schemas/mongoose/common/localized-text';

export class PetBreed extends BaseModel<PetBreed> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  type: Types.ObjectId;

  @IsObject()
  @ValidateNested()
  name: LocalizedText;
}

export interface IPetBreedInstanceMethods extends IBaseInstanceMethods {}
export interface IPetBreedModel extends Model<PetBreed, Record<string, unknown>, IPetBreedInstanceMethods> {}
