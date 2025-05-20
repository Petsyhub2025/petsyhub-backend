import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsBirthDate } from '@common/decorators/class-validator/common';
import {
  IsInstance,
  IsString,
  IsOptional,
  IsUrl,
  IsEnum,
  IsNumber,
  Max,
  Min,
  IsBoolean,
  MaxLength,
  IsUUID,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Types, Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { PetGenderEnum, PetStatusEnum } from './pet.enum';
import { PetUser } from './subschemas/pet-user/pet-user.type';
import { Media } from '@common/schemas/mongoose/common/media';

export class Pet extends BaseModel<Pet> {
  @IsUUID()
  privateId: string;

  @IsObject()
  @ValidateNested()
  user: PetUser;

  @IsString()
  name: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  profilePictureMedia?: Media;

  @IsOptional()
  @IsUUID()
  profilePictureMediaProcessingId?: string;

  @IsString()
  @IsEnum(PetGenderEnum)
  @IsOptional()
  gender?: PetGenderEnum;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  type: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  breed: Types.ObjectId;

  @IsBirthDate()
  birthDate: string;

  @IsNumber()
  @Max(200)
  @Min(1)
  @IsOptional()
  height?: number;

  @IsNumber()
  @Max(500)
  @IsOptional()
  weight?: number;

  @IsNumber()
  @IsOptional()
  passportNumber?: number;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsBoolean()
  isLost?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @IsEnum(PetStatusEnum)
  status?: PetStatusEnum;

  @IsOptional()
  @IsNumber()
  totalPosts?: number;

  @IsOptional()
  @IsNumber()
  totalFollowers?: number;
}

export interface IPetInstanceMethods extends IBaseInstanceMethods {}
export interface IPetModel extends Model<Pet, Record<string, unknown>, IPetInstanceMethods> {}
