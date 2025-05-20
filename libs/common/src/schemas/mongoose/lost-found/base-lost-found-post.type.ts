import { TransformObjectId } from '@common/decorators/class-transformer';
import { Type } from 'class-transformer';
import {
  IsInstance,
  IsString,
  IsNotEmpty,
  MaxLength,
  IsObject,
  ValidateNested,
  IsArray,
  ArrayNotEmpty,
  ArrayMaxSize,
  ArrayMinSize,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { Types, Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '../base/base-schema';
import { GooglePlacesLocation } from '../common/google-places-location';
import { Media } from '../common/media';
import { LostFoundPostTypeEnum } from './base-lost-found-post.enum';

export class BaseLostFoundPost extends BaseModel<BaseLostFoundPost> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  authorUser: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  description: string;

  @IsObject()
  @ValidateNested()
  locationData: GooglePlacesLocation;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(3)
  @ArrayMinSize(1)
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => Media)
  media: Media[];

  @IsOptional()
  @IsUUID()
  mediaProcessingId?: string;

  @IsOptional()
  @IsString()
  @IsEnum(LostFoundPostTypeEnum)
  postType?: LostFoundPostTypeEnum;
}

export interface IBaseLostFoundPostInstanceMethods extends IBaseInstanceMethods {}
export interface IBaseLostFoundPostModel
  extends Model<BaseLostFoundPost, Record<string, unknown>, IBaseLostFoundPostInstanceMethods> {}
