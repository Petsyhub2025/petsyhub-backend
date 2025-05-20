import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { Connection, HydratedDocument, Schema } from 'mongoose';
import { BaseVersion, IBaseVersionInstanceMethods, IBaseVersionModel } from './base-version.type';
import { BackEndVersionsSubSchema } from './base-version-sub-schemas/backend-versions';

const BaseVersionSchema = new Schema<BaseVersion, IBaseVersionModel, IBaseVersionInstanceMethods>(
  {
    backendVersions: {
      type: BackEndVersionsSubSchema,
    },

    isDeprecated: {
      type: Boolean,
      default: false,
    },

    ...BaseSchema,
  },
  {
    discriminatorKey: 'versionType',
    timestamps: true,
  },
);

export function baseVersionSchemaFactory(connection: Connection) {
  BaseVersionSchema.index({ versionType: 1 });
  BaseVersionSchema.index({ versionType: 1, _id: -1 });
  BaseVersionSchema.index({
    'androidVersion.min.major': 1,
    'androidVersion.min.minor': 1,
    'androidVersion.min.patch': 1,
  });
  BaseVersionSchema.index({
    'androidVersion.max.major': 1,
    'androidVersion.max.minor': 1,
    'androidVersion.max.patch': 1,
  });
  BaseVersionSchema.index({
    'iosVersion.min.major': 1,
    'iosVersion.min.minor': 1,
    'iosVersion.min.patch': 1,
  });
  BaseVersionSchema.index({
    'iosVersion.max.major': 1,
    'iosVersion.max.minor': 1,
    'iosVersion.max.patch': 1,
  });

  BaseVersionSchema.pre('validate', async function () {
    await validateSchema(this, BaseVersion);
  });

  BaseVersionSchema.methods.deleteDoc = async function (this: HydratedDocument<BaseVersion>) {
    await this.deleteOne();
  };

  const baseVersionModel = connection.model(ModelNames.BASE_APP_VERSION, BaseVersionSchema);

  return baseVersionModel;
}
