import { BaseBranch, IBaseBranchInstanceMethods } from '@common/schemas/mongoose/branch/base-branch.type';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Model } from 'mongoose';
import { EstimationArrivalUnitEnum, ShippingTypeEnum } from '@common/schemas/mongoose/branch/base-branch.enum';

export class ShopBranch extends BaseBranch {
  @IsBoolean()
  isSelfShipping: boolean;

  @IsNumber()
  @IsOptional()
  shippingFee?: number;

  @IsOptional()
  @IsNumber()
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

export interface IShopBranchInstanceMethods extends IBaseBranchInstanceMethods {}
export interface IShopBranchModel extends Model<ShopBranch, Record<string, unknown>, IShopBranchInstanceMethods> {}
