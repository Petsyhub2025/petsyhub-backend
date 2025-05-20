import { TransformObjectId } from '@common/decorators/class-transformer';
import { Type } from 'class-transformer';
import {
  IsString,
  IsInstance,
  ValidateIf,
  IsObject,
  ValidateNested,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsNotEmpty,
  MinLength,
  ArrayNotEmpty,
  IsMobilePhone,
  IsEmail,
  IsDate,
  IsUUID,
} from 'class-validator';
import { Types, HydratedDocument, Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { PointLocation } from '@common/schemas/mongoose/common/point';
import { BranchTypeEnum, BranchStatusEnum } from './base-branch.enum';
import { ScheduleType } from './subschemas/schedule';
import { Media } from '@common/schemas/mongoose/common/media';

export class BaseBranch extends BaseModel<BaseBranch> {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  country: Types.ObjectId;

  @ValidateIf((o) => !!o.country)
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  city: Types.ObjectId;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  area?: Types.ObjectId;

  @IsObject()
  @ValidateNested()
  location: PointLocation;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  streetAddress: string;

  @IsOptional()
  @IsNumber()
  postalCode?: number;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  brand: Types.ObjectId;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Media)
  documents?: Media[];

  @IsOptional()
  @IsUUID()
  mediaProcessingId?: string;

  @IsOptional()
  @IsString()
  @IsEnum(BranchStatusEnum)
  status?: BranchStatusEnum;

  @IsOptional()
  @IsString()
  @MinLength(2)
  rejectionReason?: string;

  @IsString()
  @IsEnum(BranchTypeEnum)
  branchType: BranchTypeEnum;

  @IsOptional()
  @IsMobilePhone()
  phoneNumber?: string;

  @IsOptional()
  @IsMobilePhone()
  additionalPhoneNumber?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => ScheduleType)
  schedule: ScheduleType[];

  @IsOptional()
  @IsDate()
  approvedAt?: Date;

  @IsOptional()
  @IsDate()
  rejectedAt?: Date;

  @IsNumber()
  @IsOptional()
  rating?: number;

  @IsNumber()
  @IsOptional()
  totalRatings: number;
}

export interface IBaseBranchInstanceMethods extends IBaseInstanceMethods {
  approveDoc: (this: HydratedDocument<BaseBranch>) => Promise<void>;
  rejectDoc: (this: HydratedDocument<BaseBranch>, rejectionReason: string) => Promise<void>;
}
export interface IBaseBranchModel extends Model<BaseBranch, Record<string, unknown>, IBaseBranchInstanceMethods> {}
