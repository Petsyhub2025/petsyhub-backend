import { Schema } from 'mongoose';
import { BranchAccessRoleSubSchemaType } from './branch-access-role.type';
import { ModelNames } from '@common/constants';
import { BranchAccessRoleLevelEnum } from '@common/schemas/mongoose/branch-access-control/branch-access-role/branch-access-role.enum';
import { LocalizedTextSchema } from '@common/schemas/mongoose/common/localized-text';

export const BranchAccessRoleSubSchema = new Schema<BranchAccessRoleSubSchemaType>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.BRANCH_ACCESS_ROLE,
      required: true,
    },
    name: {
      type: LocalizedTextSchema(),
      required: true,
    },
    level: {
      type: String,
      required: true,
      enum: BranchAccessRoleLevelEnum,
    },
  },
  {
    _id: false,
    timestamps: false,
  },
);
