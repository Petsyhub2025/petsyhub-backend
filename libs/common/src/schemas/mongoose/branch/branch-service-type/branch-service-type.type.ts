import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { LocalizedText } from '@common/schemas/mongoose/common/localized-text';
import { IsEnum, IsHexColor, IsObject, IsString, ValidateNested } from 'class-validator';
import { Model } from 'mongoose';
import { BranchTypeEnum } from '@common/schemas/mongoose/branch/base-branch.enum';
import { Media } from '@common/schemas/mongoose/common/media';

export class BranchServiceType extends BaseModel<BranchServiceType> {
  @IsObject()
  @ValidateNested()
  name: LocalizedText;

  @IsObject()
  @ValidateNested()
  typePictureMedia: Media;

  @IsHexColor()
  color: string;

  @IsString()
  @IsEnum(BranchTypeEnum)
  branchType: BranchTypeEnum;
}

export interface IBranchServiceTypeInstanceMethods extends IBaseInstanceMethods {}
export interface IBranchServiceTypeModel
  extends Model<BranchServiceType, Record<string, unknown>, IBranchServiceTypeInstanceMethods> {}
