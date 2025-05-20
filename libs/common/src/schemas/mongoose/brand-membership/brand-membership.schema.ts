import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { Schema, Connection, HydratedDocument } from 'mongoose';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { BrandMembership, IBrandMembershipInstanceMethods, IBrandMembershipModel } from './brand-membership.type';
import { ExtendedBranchAccessControlSubSchema } from './subschemas/extended-branch-access/extended-branch-access-control.schema';

export const BrandMembershipSchema = new Schema<
  BrandMembership,
  IBrandMembershipModel,
  IBrandMembershipInstanceMethods
>(
  {
    serviceProvider: { type: Schema.Types.ObjectId, ref: ModelNames.SERVICE_PROVIDER, required: true },
    brand: { type: Schema.Types.ObjectId, ref: ModelNames.BRAND, required: true },
    isBrandOwner: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: false },
    defaultBranchAccessControl: { type: ExtendedBranchAccessControlSubSchema, required: false },
    assignedBranches: {
      type: [Schema.Types.ObjectId],
      ref: ModelNames.BASE_BRANCH,
      default: [],
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

export function brandMembershipSchemaFactory(connection: Connection) {
  BrandMembershipSchema.index({ serviceProvider: 1 });
  BrandMembershipSchema.index({ brand: 1 });
  BrandMembershipSchema.index({ isOwner: 1 });
  BrandMembershipSchema.index({ isDefault: 1 });

  BrandMembershipSchema.pre('validate', async function () {
    await validateSchema(this, BrandMembership);
  });

  BrandMembershipSchema.methods.deleteDoc = async function (this: HydratedDocument<BrandMembership>) {
    await this.deleteOne();
  };

  const brandMembershipModel = connection.model(ModelNames.BRAND_MEMBERSHIP, BrandMembershipSchema);

  return brandMembershipModel;
}
