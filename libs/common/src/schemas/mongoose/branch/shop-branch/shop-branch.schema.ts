import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { HydratedDocument, Schema } from 'mongoose';
import { ShopBranch, IShopBranchInstanceMethods, IShopBranchModel } from './shop-branch.type';
import { IBaseBranchModel } from '@common/schemas/mongoose/branch/base-branch.type';
import {
  BranchTypeEnum,
  EstimationArrivalUnitEnum,
  ShippingTypeEnum,
} from '@common/schemas/mongoose/branch/base-branch.enum';

export const ShopBranchSchema = new Schema<ShopBranch, IShopBranchModel, IShopBranchInstanceMethods>(
  {
    shippingFee: { type: Number, required: false, default: 0 },
    isSelfShipping: { type: Boolean, required: false },
    estimatedArrivalTime: { type: Number, required: false },
    estimatedArrivalUnit: { type: String, enum: EstimationArrivalUnitEnum, required: false },
    shippingType: { type: String, enum: ShippingTypeEnum, required: false },
  },
  {
    timestamps: true,
  },
);

export function shopBranchSchemaFactory(baseBranch: IBaseBranchModel) {
  ShopBranchSchema.pre('validate', async function () {
    await validateSchema(this, ShopBranch);
  });

  ShopBranchSchema.methods.deleteDoc = async function (this: HydratedDocument<ShopBranch>) {
    await this.deleteOne();
  };

  const shopBranchModel = baseBranch.discriminator(ModelNames.SHOP_BRANCH, ShopBranchSchema, BranchTypeEnum.SHOP);

  return shopBranchModel;
}
