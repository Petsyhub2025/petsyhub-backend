import { ExtendedBranchAccessControlSubSchemaType } from './extended-branch-access-control.type';
import { ServiceProviderStatusEnum } from '@common/schemas/mongoose/serviceprovider/serviceprovider.enum';
import { Schema } from 'mongoose';
import { BranchAccessPermissionSchema } from '@common/schemas/mongoose/branch-access-control/branch-access-permissions';
import { BranchAccessRoleSubSchema } from '@common/schemas/mongoose/branch-access-control/subschemas/branch-access-role';
import { ModelNames } from '@common/constants';

export const ExtendedBranchAccessControlSubSchema = new Schema<ExtendedBranchAccessControlSubSchemaType>(
  {
    branch: { type: Schema.Types.ObjectId, ref: ModelNames.BASE_BRANCH, required: true },

    permissions: {
      type: BranchAccessPermissionSchema,
      required: true,
    },

    role: {
      type: BranchAccessRoleSubSchema,
      required: true,
    },

    status: {
      type: String,
      enum: ServiceProviderStatusEnum,
      default: ServiceProviderStatusEnum.PENDING_ADMIN_APPROVAL,
    },
  },
  {
    timestamps: false,
    _id: false,
  },
);
