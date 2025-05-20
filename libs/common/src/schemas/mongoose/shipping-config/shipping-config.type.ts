import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { Model } from 'mongoose';
import { EstimationArrivalUnitEnum } from '@common/schemas/mongoose/branch/base-branch.enum';

export class ShippingConfig extends BaseModel<ShippingConfig> {
  @IsNumber()
  shippingFee: number;

  @IsNumber()
  estimatedArrivalTime: number;

  @IsString()
  @IsEnum(EstimationArrivalUnitEnum)
  estimatedArrivalUnit: EstimationArrivalUnitEnum;

  @IsNumber()
  tax: number;
}
export interface IShippingConfigInstanceMethods extends IBaseInstanceMethods {}
export interface IShippingConfigModel
  extends Model<ShippingConfig, Record<string, unknown>, IShippingConfigInstanceMethods> {}
