import { ModelNames } from '@common/constants';
import { Connection, Schema } from 'mongoose';
import { UserFCMTokenPlatformEnum } from './user-fcm-token.enum';
import { IUserFCMTokenInstanceMethods, IUserFCMTokenModel, UserFCMToken } from './user-fcm-token.type';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { Logger } from '@nestjs/common';
import { UserDevicesSubSchemaType } from '@common/schemas/mongoose/user/user-subschemas/user-devices';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';

const UserFCMTokenSchema = new Schema<UserFCMToken, IUserFCMTokenModel, IUserFCMTokenInstanceMethods>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.USER,
      required: true,
    },

    fcmToken: {
      type: String,
      required: true,
    },

    appVersion: {
      type: String,
      required: true,
    },

    platform: {
      type: String,
      enum: UserFCMTokenPlatformEnum,
      required: true,
    },

    ...BaseSchema,
  },
  { timestamps: true },
);

export function userFCMTokenSchemaFactory(connection: Connection) {
  UserFCMTokenSchema.index({ user: 1 });
  UserFCMTokenSchema.index({ fcmToken: 1 }, { unique: true });
  UserFCMTokenSchema.index({ user: 1, fcmToken: 1 });

  UserFCMTokenSchema.post('save', async function () {
    const userModel = connection.model(ModelNames.USER);

    try {
      const versionParts = this.appVersion.split('.').map((part) => parseInt(part, 10));
      const userDevice: UserDevicesSubSchemaType = {
        platform: this.platform,
        installedVersion: {
          major: versionParts[0],
          minor: versionParts[1],
          patch: versionParts[2],
        },
      };
      await validateSchema(userDevice, UserDevicesSubSchemaType);
      await userModel.findOneAndUpdate(
        { _id: this.user },
        {
          $pull: {
            devices: {
              platform: this.platform,
            },
          },
        },
      );

      await userModel.findOneAndUpdate(
        { _id: this.user },
        {
          $addToSet: {
            devices: userDevice,
          },
        },
      );
    } catch (error) {
      new Logger('UserFCMTokenSchema').error('Failed to update user devices: ' + error?.message, { error });
    }
  });

  const userFCMTokenModel = connection.model(ModelNames.USER_FCM_TOKEN, UserFCMTokenSchema);

  return userFCMTokenModel;
}
