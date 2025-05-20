import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { HydratedDocument, Schema } from 'mongoose';
import { AndroidVersion, IAndroidVersionInstanceMethods, IAndroidVersionModel } from './android-version.type';
import { BaseVersionSubSchema } from '../base-version/base-version-sub-schemas/base-version';
import { VersionType } from '../base-version/base-version.enum';
import { IBaseVersionModel } from '../base-version/base-version.type';

const AndroidVersionSchema = new Schema<AndroidVersion, IAndroidVersionModel, IAndroidVersionInstanceMethods>(
  {
    androidVersion: {
      type: BaseVersionSubSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export function androidVersionSchemaFactory(baseVersionModel: IBaseVersionModel) {
  AndroidVersionSchema.pre('validate', async function () {
    await validateSchema(this, AndroidVersion);
  });

  AndroidVersionSchema.methods.deleteDoc = async function (this: HydratedDocument<AndroidVersion>) {
    await this.deleteOne();
  };

  const androidVersionModel = baseVersionModel.discriminator(
    ModelNames.ANDROID_APP_VERSION,
    AndroidVersionSchema,
    VersionType.ANDROID,
  );

  return androidVersionModel;
}
