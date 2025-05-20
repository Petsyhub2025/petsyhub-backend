import { TransformObjectId, TransformObjectIds } from '@common/decorators/class-transformer';
import { LocalizedText } from '@common/schemas/mongoose/common/localized-text';
import { Media } from '@common/schemas/mongoose/common/media';
import { CountryCurrenciesEnum } from '@common/schemas/mongoose/country/country.enum';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInstance,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';

export class ProductExtendedType {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  productId: Types.ObjectId;

  @IsObject()
  @ValidateNested()
  name: LocalizedText;

  @IsObject()
  @ValidateNested()
  description: LocalizedText;

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

  @IsNumber()
  price: number;

  @IsString()
  @IsEnum(CountryCurrenciesEnum)
  currency: CountryCurrenciesEnum;

  @IsNumber()
  quantityInStock: number;

  @IsOptional()
  @IsNumber()
  totalOrders?: number = 0; // Default to 0
}
