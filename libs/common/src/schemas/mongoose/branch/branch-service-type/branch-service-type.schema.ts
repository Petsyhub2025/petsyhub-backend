import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { Connection, HydratedDocument, Schema } from 'mongoose';
import {
  BranchServiceType,
  IBranchServiceTypeInstanceMethods,
  IBranchServiceTypeModel,
} from './branch-service-type.type';
import { LocalizedTextSchema } from '@common/schemas/mongoose/common/localized-text';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { BranchTypeEnum } from '@common/schemas/mongoose/branch/base-branch.enum';
import { MediaSchema } from '@common/schemas/mongoose/common/media';

const BranchServiceTypeSchema = new Schema<
  BranchServiceType,
  IBranchServiceTypeModel,
  IBranchServiceTypeInstanceMethods
>(
  {
    name: {
      type: LocalizedTextSchema(),
      required: true,
    },

    typePictureMedia: {
      type: MediaSchema,
      required: true,
    },

    color: {
      type: String,
      required: true,
    },

    branchType: {
      type: String,
      enum: BranchTypeEnum,
      required: true,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function branchServiceTypeSchemaFactory(connection: Connection) {
  BranchServiceTypeSchema.index({ 'name.en': 1 }, { unique: true });
  BranchServiceTypeSchema.index({ 'name.ar': 1 }, { unique: true });
  BranchServiceTypeSchema.index({ _id: 1, name: 1 });
  BranchServiceTypeSchema.index({ _id: 1, color: 1 });
  BranchServiceTypeSchema.index({ _id: 1, typePictureUrl: 1 });
  BranchServiceTypeSchema.index({ color: 1 });
  BranchServiceTypeSchema.index({ typePictureUrl: 1 });
  BranchServiceTypeSchema.index({ branchType: 1 });

  BranchServiceTypeSchema.pre('validate', async function () {
    await validateSchema(this, BranchServiceType);
  });

  //TODO:ADD POST DELETE TO REMOVE ALL branchs related to this type?
  BranchServiceTypeSchema.methods.deleteDoc = async function (this: HydratedDocument<BranchServiceType>) {
    await this.deleteOne();
  };

  const branchServiceTypeModel = connection.model(ModelNames.BRANCH_SERVICE_TYPE, BranchServiceTypeSchema);

  return branchServiceTypeModel;
}
