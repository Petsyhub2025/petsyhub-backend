import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInstance,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Model, Types } from 'mongoose';
import { TransformObjectId, TransformObjectIds } from '@common/decorators/class-transformer';
import { BranchAccessPermissions } from './branch-access-permissions';
import { BranchAccessRoleSubSchemaType } from './subschemas/branch-access-role';
import { Type } from 'class-transformer';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { ServiceProviderStatusEnum } from '@common/schemas/mongoose/serviceprovider/serviceprovider.enum';
import { Media } from '@common/schemas/mongoose/common/media';

export class BranchAccessControl extends BaseModel {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  brand: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  branch: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  serviceProvider: Types.ObjectId;

  @IsObject()
  @ValidateNested()
  permissions: BranchAccessPermissions;

  @IsObject()
  @ValidateNested()
  role: BranchAccessRoleSubSchemaType;

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
  @IsEnum(ServiceProviderStatusEnum)
  status?: ServiceProviderStatusEnum;

  @IsOptional()
  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  medicalSpecialties?: Types.ObjectId[];

  @IsBoolean()
  isDefault: boolean;
}

export interface IBranchAccessControlInstanceMethods extends IBaseInstanceMethods {}
export interface IBranchAccessControlModel
  extends Model<BranchAccessControl, Record<string, unknown>, IBranchAccessControlInstanceMethods> {}
