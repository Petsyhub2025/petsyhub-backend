import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { HydratedDocument, Schema } from 'mongoose';
import { DayCareBranch, IDayCareBranchInstanceMethods, IDayCareBranchModel } from './daycare-branch.type';
import { IBaseBranchModel } from '@common/schemas/mongoose/branch/base-branch.type';
import { BranchTypeEnum } from '@common/schemas/mongoose/branch/base-branch.enum';

export const DayCareBranchSchema = new Schema<DayCareBranch, IDayCareBranchModel, IDayCareBranchInstanceMethods>(
  {},
  {
    timestamps: true,
  },
);

export function dayCareBranchSchemaFactory(baseBranch: IBaseBranchModel) {
  DayCareBranchSchema.pre('validate', async function () {
    await validateSchema(this, DayCareBranch);
  });

  DayCareBranchSchema.methods.deleteDoc = async function (this: HydratedDocument<DayCareBranch>) {
    await this.deleteOne();
  };

  const dayCareBranchModel = baseBranch.discriminator(
    ModelNames.DAYCARE_BRANCH,
    DayCareBranchSchema,
    BranchTypeEnum.DAYCARE,
  );

  return dayCareBranchModel;
}
