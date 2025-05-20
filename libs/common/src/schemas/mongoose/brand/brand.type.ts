import { TransformObjectIds } from '@common/decorators/class-transformer';
import {
  IsString,
  IsOptional,
  IsArray,
  IsInstance,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEmail,
  ValidateNested,
  IsObject,
  IsPhoneNumber,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { Types, Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { Media } from '@common/schemas/mongoose/common/media';
import { BrandTypeEnum } from './brand.enum';

export class Brand extends BaseModel<Brand> {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  logoPictureMedia?: Media;

  @IsOptional()
  @IsUUID()
  logoPictureMediaProcessingId?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  coverPictureMedia?: Media;

  @IsOptional()
  @IsUUID()
  coverPictureMediaProcessingId?: string;

  @IsOptional()
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber?: string;

  @IsOptional()
  @IsPhoneNumber()
  anotherPhoneNumber?: string;

  @IsOptional()
  @IsString()
  hotline?: string;

  @IsOptional()
  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  countries?: Types.ObjectId[];

  @IsOptional()
  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  cities?: Types.ObjectId[];

  @IsOptional()
  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  areas?: Types.ObjectId[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  bio?: string;

  @IsString()
  @IsEnum(BrandTypeEnum)
  brandType: BrandTypeEnum;
}

export interface IBrandInstanceMethods extends IBaseInstanceMethods {}
export interface IBrandModel extends Model<Brand, Record<string, unknown>, IBrandInstanceMethods> {}
