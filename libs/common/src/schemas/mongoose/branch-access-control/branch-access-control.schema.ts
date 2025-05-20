import { ModelNames } from '@common/constants';
import { Connection, HydratedDocument, Schema } from 'mongoose';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import {
  BranchAccessControl,
  IBranchAccessControlInstanceMethods,
  IBranchAccessControlModel,
} from './branch-access-control.type';
import { BranchAccessPermissionSchema } from './branch-access-permissions';
import { BranchAccessRoleSubSchema } from './subschemas/branch-access-role';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { ServiceProviderStatusEnum } from '@common/schemas/mongoose/serviceprovider/serviceprovider.enum';
import { MediaSchema } from '@common/schemas/mongoose/common/media';

export const BranchAccessControlSchema = new Schema<
  BranchAccessControl,
  IBranchAccessControlModel,
  IBranchAccessControlInstanceMethods
>(
  {
    branch: { type: Schema.Types.ObjectId, ref: ModelNames.BASE_BRANCH, required: true },

    brand: { type: Schema.Types.ObjectId, ref: ModelNames.BRAND, required: true },

    documents: { type: [MediaSchema], required: false },

    mediaProcessingId: { type: String, required: false },

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

    serviceProvider: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.SERVICE_PROVIDER,
      required: true,
    },

    medicalSpecialties: { type: [Schema.Types.ObjectId], ref: ModelNames.MEDICAL_SPECIALTY, required: false },

    isDefault: {
      type: Boolean,
      required: true,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
      },
    },
  },
);

export function branchAccessControlSchemaFactory(connection: Connection) {
  BranchAccessControlSchema.index({ branch: 1 });
  BranchAccessControlSchema.index({ status: 1 });
  BranchAccessControlSchema.index({ serviceProvider: 1 });

  BranchAccessControlSchema.pre('validate', async function () {
    await validateSchema(this, BranchAccessControl);
  });

  BranchAccessControlSchema.methods.deleteDoc = async function (this: HydratedDocument<BranchAccessControl>) {
    await this.deleteOne();
  };

  const branchAccessControlModel = connection.model(ModelNames.BRANCH_ACCESS_CONTROL, BranchAccessControlSchema);

  return branchAccessControlModel;
}
