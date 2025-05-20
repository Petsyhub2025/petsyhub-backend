import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsInstance,
  IsNotEmpty,
  IsObject,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Model, Types } from 'mongoose';
import { Media } from '@common/schemas/mongoose/common/media';
import { TransformObjectId, TransformObjectIds } from '@common/decorators/class-transformer';
import { LocalizedText } from '@common/schemas/mongoose/common/localized-text';

export class Product extends BaseModel<Product> {
  @IsObject()
  @ValidateNested()
  name: LocalizedText;

  @IsObject()
  @ValidateNested()
  description: LocalizedText;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => Media)
  media: Media[];

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  category: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  subCategory: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  supplier: Types.ObjectId;

  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  petTypes: Types.ObjectId[];
}

export interface IProductInstanceMethods extends IBaseInstanceMethods {}
export interface IProductModel extends Model<Product, Record<string, unknown>, IProductInstanceMethods> {}
