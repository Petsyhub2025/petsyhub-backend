import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { HydratedDocument, Schema } from 'mongoose';
import { ClinicBranch, IClinicBranchInstanceMethods, IClinicBranchModel } from './clinic-branch.type';
import { IBaseBranchModel } from '@common/schemas/mongoose/branch/base-branch.type';
import { BranchTypeEnum } from '@common/schemas/mongoose/branch/base-branch.enum';

export const ClinicBranchSchema = new Schema<ClinicBranch, IClinicBranchModel, IClinicBranchInstanceMethods>(
  {
    petTypes: { type: [Schema.Types.ObjectId], ref: ModelNames.PET_TYPE, required: true },
    serviceTypes: {
      type: [Schema.Types.ObjectId],
      ref: ModelNames.BRANCH_SERVICE_TYPE,
      required: true,
    },
    medicalSpecialties: { type: [Schema.Types.ObjectId], ref: ModelNames.MEDICAL_SPECIALTY, required: true },
  },
  {
    timestamps: true,
  },
);

export function clinicBranchSchemaFactory(baseBranch: IBaseBranchModel) {
  ClinicBranchSchema.pre('validate', async function () {
    await validateSchema(this, ClinicBranch);
  });

  ClinicBranchSchema.methods.deleteDoc = async function (this: HydratedDocument<ClinicBranch>) {
    await this.deleteOne();
  };

  const clinicBranchModel = baseBranch.discriminator(
    ModelNames.CLINIC_BRANCH,
    ClinicBranchSchema,
    BranchTypeEnum.CLINIC,
  );

  return clinicBranchModel;
}
