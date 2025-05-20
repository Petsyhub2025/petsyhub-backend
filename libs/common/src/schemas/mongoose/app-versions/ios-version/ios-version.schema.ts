import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { Schema } from 'mongoose';
import { IIosVersionInstanceMethods, IIosVersionModel, IosVersion } from './ios-version.type';
import { HydratedDocument } from 'mongoose';
import { BaseVersionSubSchema } from '../base-version/base-version-sub-schemas/base-version';
import { VersionType } from '../base-version/base-version.enum';
import { IBaseVersionModel } from '../base-version/base-version.type';

const IosVersionSchema = new Schema<IosVersion, IIosVersionModel, IIosVersionInstanceMethods>(
  {
    iosVersion: {
      type: BaseVersionSubSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export function iosVersionSchemaFactory(baseVersionModel: IBaseVersionModel) {
  IosVersionSchema.pre('validate', async function () {
    await validateSchema(this, IosVersion);
  });

  IosVersionSchema.methods.deleteDoc = async function (this: HydratedDocument<IosVersion>) {
    await this.deleteOne();
  };

  const iosVersionModel = baseVersionModel.discriminator(ModelNames.IOS_APP_VERSION, IosVersionSchema, VersionType.IOS);

  return iosVersionModel;
}
