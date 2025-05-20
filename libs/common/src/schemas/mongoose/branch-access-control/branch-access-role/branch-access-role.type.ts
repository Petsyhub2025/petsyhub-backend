import { IsArray, IsEnum, IsObject, IsString, ValidateNested } from 'class-validator';
import { Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { BranchAccessRoleLevelEnum } from './branch-access-role.enum';
import { LocalizedText } from '@common/schemas/mongoose/common/localized-text';
import { BranchTypeEnum } from '@common/schemas/mongoose/branch/base-branch.enum';

export class BranchAccessRole extends BaseModel {
  @IsObject()
  @ValidateNested()
  name: LocalizedText;

  @IsString()
  @IsEnum(BranchAccessRoleLevelEnum)
  level: BranchAccessRoleLevelEnum;

  @IsArray()
  @IsEnum(BranchTypeEnum, { each: true })
  branchTypes: BranchTypeEnum[];
}

export interface IBranchAccessRoleInstanceMethods extends IBaseInstanceMethods {}
export interface IBranchAccessRoleModel
  extends Model<BranchAccessRole, Record<string, unknown>, IBranchAccessRoleInstanceMethods> {}
