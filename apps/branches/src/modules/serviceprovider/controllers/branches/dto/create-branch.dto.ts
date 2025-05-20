import {
  BaseBranch,
  BranchAccessPermissions,
  BranchTypeEnum,
  EstimationArrivalUnitEnum,
  IsMediaUploadFileValid,
  LocationDto,
  Media,
  MediaUploadFile,
  ShippingTypeEnum,
  TransformObjectId,
  TransformObjectIds,
} from '@instapets-backend/common';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInstance,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';

export class AssignedBranchMemberDto {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  serviceProvider: Types.ObjectId;

  @IsObject()
  @ValidateNested()
  permissions: BranchAccessPermissions;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  role: Types.ObjectId;

  @IsArray()
  @ArrayNotEmpty()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @IsMediaUploadFileValid({ s3Only: true }, { each: true })
  @Type(() => MediaUploadFile)
  documents: MediaUploadFile[];

  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @ApiProperty({ type: [String] })
  medicalSpecialties: Types.ObjectId[];
}
export class CreateBranchDto extends PickType(BaseBranch, [
  'name',
  'branchType',
  'additionalPhoneNumber',
  'streetAddress',
  'postalCode',
  'schedule',
  'email',
] as const) {
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  brand: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  country: Types.ObjectId;

  @ValidateIf((o) => !!o.country)
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  city: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  area: Types.ObjectId;

  @IsObject()
  @ValidateNested()
  location: LocationDto;

  @ValidateIf((o) => o.branchType === BranchTypeEnum.CLINIC)
  @IsArray()
  @ArrayNotEmpty()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @ApiProperty({ type: [String] })
  petTypes?: Types.ObjectId[];

  @ValidateIf((o) => o.branchType === BranchTypeEnum.CLINIC)
  @IsArray()
  @ArrayNotEmpty()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @ApiProperty({ type: [String] })
  serviceTypes?: Types.ObjectId[];

  @ValidateIf((o) => o.branchType === BranchTypeEnum.CLINIC)
  @IsArray()
  @ArrayNotEmpty()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @ApiProperty({ type: [String] })
  medicalSpecialties?: Types.ObjectId[];

  @ValidateIf((o) => o.branchType === BranchTypeEnum.CLINIC)
  @IsArray()
  @ArrayNotEmpty()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => AssignedBranchMemberDto)
  assignedBranchMemberDto?: AssignedBranchMemberDto[];

  @IsArray()
  @ArrayNotEmpty()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @IsMediaUploadFileValid({ s3Only: true }, { each: true })
  @Type(() => MediaUploadFile)
  documents: MediaUploadFile[];

  @IsBoolean()
  @IsOptional()
  isSelfShipping?: boolean;

  @IsNumber()
  @IsOptional()
  shippingFee?: number;

  @IsNumber()
  @IsOptional()
  estimatedArrivalTime?: number;

  @IsOptional()
  @IsString()
  @IsEnum(EstimationArrivalUnitEnum)
  estimatedArrivalUnit?: EstimationArrivalUnitEnum;

  @IsOptional()
  @IsString()
  @IsEnum(ShippingTypeEnum)
  shippingType?: ShippingTypeEnum;
}
