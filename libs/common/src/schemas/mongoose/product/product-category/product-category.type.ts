import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { Model } from 'mongoose';
import { LocalizedText } from '@common/schemas/mongoose/common/localized-text';
import { IsObject, ValidateNested } from 'class-validator';
import { Media } from '@common/schemas/mongoose/common/media';

export class ProductCategory extends BaseModel<ProductCategory> {
  @IsObject()
  @ValidateNested()
  name: LocalizedText;

  @IsObject()
  @ValidateNested()
  iconMedia: Media;

  @IsObject()
  @ValidateNested()
  description: LocalizedText;
}
export interface IProductCategoryInstanceMethods extends IBaseInstanceMethods {}
export interface IProductCategoryModel
  extends Model<ProductCategory, Record<string, unknown>, IProductCategoryInstanceMethods> {}
