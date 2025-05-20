import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { HydratedDocument, Schema } from 'mongoose';
import { SpaBranch, ISpaBranchInstanceMethods, ISpaBranchModel } from './spa-branch.type';
import { IBaseBranchModel } from '@common/schemas/mongoose/branch/base-branch.type';
import { BranchTypeEnum } from '@common/schemas/mongoose/branch/base-branch.enum';

export const SpaBranchSchema = new Schema<SpaBranch, ISpaBranchModel, ISpaBranchInstanceMethods>(
  {},
  {
    timestamps: true,
  },
);

export function spaBranchSchemaFactory(baseBranch: IBaseBranchModel) {
  SpaBranchSchema.pre('validate', async function () {
    await validateSchema(this, SpaBranch);
  });

  SpaBranchSchema.methods.deleteDoc = async function (this: HydratedDocument<SpaBranch>) {
    await this.deleteOne();
  };

  const spaBranchModel = baseBranch.discriminator(ModelNames.SPA_BRANCH, SpaBranchSchema, BranchTypeEnum.SPA);

  return spaBranchModel;
}
