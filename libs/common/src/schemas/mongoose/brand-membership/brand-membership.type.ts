import { IsArray, IsBoolean, IsInstance, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Model, Types } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { Type } from 'class-transformer';
import { ExtendedBranchAccessControlSubSchemaType } from './subschemas/extended-branch-access/extended-branch-access-control.type';
import { TransformObjectId, TransformObjectIds } from '@common/decorators/class-transformer';

export class BrandMembership extends BaseModel<BrandMembership> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  serviceProvider: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  brand: Types.ObjectId;

  @IsOptional()
  @IsBoolean()
  isBrandOwner?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ExtendedBranchAccessControlSubSchemaType)
  defaultBranchAccessControl?: ExtendedBranchAccessControlSubSchemaType;

  @IsOptional()
  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  assignedBranches?: Types.ObjectId[];
}

export interface IBrandMembershipInstanceMethods extends IBaseInstanceMethods {}
export interface IBrandMembershipModel
  extends Model<BrandMembership, Record<string, unknown>, IBrandMembershipInstanceMethods> {}
