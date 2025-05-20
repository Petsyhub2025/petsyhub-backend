import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { Connection, Schema } from 'mongoose';
import { BranchAccessRole, IBranchAccessRoleInstanceMethods, IBranchAccessRoleModel } from './branch-access-role.type';
import { LocalizedTextSchema } from '@common/schemas/mongoose/common/localized-text';
import { BranchAccessRoleLevelEnum } from './branch-access-role.enum';
import { BranchTypeEnum } from '@common/schemas/mongoose/branch/base-branch.enum';

export const BranchAccessRoleSchema = new Schema<
  BranchAccessRole,
  IBranchAccessRoleModel,
  IBranchAccessRoleInstanceMethods
>(
  {
    name: {
      type: LocalizedTextSchema(),
      required: true,
    },

    level: {
      type: String,
      enum: BranchAccessRoleLevelEnum,
      required: true,
    },

    branchTypes: {
      type: [String],
      enum: BranchTypeEnum,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export function branchAccessRoleSchemaFactory(connection: Connection) {
  BranchAccessRoleSchema.index({ name: 1 }, { unique: true });

  BranchAccessRoleSchema.pre('validate', async function () {
    await validateSchema(this, BranchAccessRole);
  });

  BranchAccessRoleSchema.pre('save', async function () {
    this.wasNew = this.isNew;
  });

  const branchAccessRoleModel = connection.model(ModelNames.BRANCH_ACCESS_ROLE, BranchAccessRoleSchema);

  return branchAccessRoleModel;
}
