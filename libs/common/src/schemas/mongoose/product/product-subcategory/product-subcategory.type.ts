import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { Model, Types } from 'mongoose';
import { LocalizedText } from '@common/schemas/mongoose/common/localized-text';
import { IsInstance, IsObject, ValidateNested } from 'class-validator';
import { Media } from '@common/schemas/mongoose/common/media';
import { TransformObjectId } from '@common/decorators/class-transformer';

export class ProductSubCategory extends BaseModel<ProductSubCategory> {
  @IsObject()
  @ValidateNested()
  name: LocalizedText;

  @IsObject()
  @ValidateNested()
  iconMedia: Media;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  productCategory: Types.ObjectId;
}
export interface IProductSubCategoryInstanceMethods extends IBaseInstanceMethods {}
export interface IProductSubCategoryModel
  extends Model<ProductSubCategory, Record<string, unknown>, IProductSubCategoryInstanceMethods> {}
