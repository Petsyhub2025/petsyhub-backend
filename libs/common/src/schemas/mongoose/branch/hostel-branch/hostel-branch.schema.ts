import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { HydratedDocument, Schema } from 'mongoose';
import { HostelBranch, IHostelBranchInstanceMethods, IHostelBranchModel } from './hostel-branch.type';
import { IBaseBranchModel } from '@common/schemas/mongoose/branch/base-branch.type';
import { BranchTypeEnum } from '@common/schemas/mongoose/branch/base-branch.enum';

export const HostelBranchSchema = new Schema<HostelBranch, IHostelBranchModel, IHostelBranchInstanceMethods>(
  {},
  {
    timestamps: true,
  },
);

export function hostelBranchSchemaFactory(baseBranch: IBaseBranchModel) {
  HostelBranchSchema.pre('validate', async function () {
    await validateSchema(this, HostelBranch);
  });

  HostelBranchSchema.methods.deleteDoc = async function (this: HydratedDocument<HostelBranch>) {
    await this.deleteOne();
  };

  const hostelBranchModel = baseBranch.discriminator(
    ModelNames.HOSTEL_BRANCH,
    HostelBranchSchema,
    BranchTypeEnum.HOSTEL,
  );

  return hostelBranchModel;
}
