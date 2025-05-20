import { TransformObjectId, TransformObjectIds } from '@common/decorators/class-transformer';
import { IsAuthorPetOrAuthorUser } from '@common/decorators/class-validator/posts';
import { Type } from 'class-transformer';
import {
  Validate,
  IsOptional,
  IsInstance,
  IsString,
  MaxLength,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsObject,
  IsBoolean,
  IsNumber,
  ArrayMaxSize,
  IsUUID,
  ArrayMinSize,
} from 'class-validator';
import { Types, Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { Media } from '@common/schemas/mongoose/common/media';
import { PostCheckInLocation } from './post-checkin-location';

export class Post extends BaseModel<Post> {
  @Validate(IsAuthorPetOrAuthorUser)
  @TransformObjectId()
  authorUser?: Types.ObjectId;

  @Validate(IsAuthorPetOrAuthorUser)
  @TransformObjectId()
  authorPet?: Types.ObjectId;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  authorPetOwnedByUser?: Types.ObjectId;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  body: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => Media)
  media: Media[];

  @IsOptional()
  @IsUUID()
  mediaProcessingId?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  checkInLocation?: PostCheckInLocation;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  allowedUsers?: Types.ObjectId[];

  @IsOptional()
  @IsBoolean()
  hasAllowedUsers?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  taggedUsers?: Types.ObjectId[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  taggedPets?: Types.ObjectId[];

  @IsOptional()
  @IsNumber()
  totalLikes?: number;

  @IsOptional()
  @IsNumber()
  totalComments?: number;

  @IsOptional()
  @IsNumber()
  totalShares?: number;

  @IsOptional()
  @IsNumber()
  totalReports?: number;

  @IsArray()
  @ArrayMaxSize(3)
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  topics: Types.ObjectId[];
}

export interface IPostInstanceMethods extends IBaseInstanceMethods {}
export interface IPostModel extends Model<Post, Record<string, unknown>, IPostInstanceMethods> {}
