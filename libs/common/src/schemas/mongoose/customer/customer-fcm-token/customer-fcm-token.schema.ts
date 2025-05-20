import { ModelNames } from '@common/constants';
import { Connection, Schema } from 'mongoose';
import { CustomerFCMTokenPlatformEnum } from './customer-fcm-token.enum';
import { ICustomerFCMTokenInstanceMethods, ICustomerFCMTokenModel, CustomerFCMToken } from './customer-fcm-token.type';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { Logger } from '@nestjs/common';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { CustomerDevicesSubSchemaType } from '@common/schemas/mongoose/customer/subschemas/customer-devices';

const CustomerFCMTokenSchema = new Schema<CustomerFCMToken, ICustomerFCMTokenModel, ICustomerFCMTokenInstanceMethods>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.CUSTOMER,
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
      enum: CustomerFCMTokenPlatformEnum,
      required: true,
    },

    ...BaseSchema,
  },
  { timestamps: true },
);

export function customerFCMTokenSchemaFactory(connection: Connection) {
  CustomerFCMTokenSchema.index({ customer: 1 });
  CustomerFCMTokenSchema.index({ fcmToken: 1 }, { unique: true });
  CustomerFCMTokenSchema.index({ customer: 1, fcmToken: 1 });

  CustomerFCMTokenSchema.post('save', async function () {
    const customerModel = connection.model(ModelNames.CUSTOMER);

    try {
      const versionParts = this.appVersion.split('.').map((part) => parseInt(part, 10));
      const customerDevice: CustomerDevicesSubSchemaType = {
        platform: this.platform,
        installedVersion: {
          major: versionParts[0],
          minor: versionParts[1],
          patch: versionParts[2],
        },
      };
      await validateSchema(customerDevice, CustomerDevicesSubSchemaType);
      await customerModel.findOneAndUpdate(
        { _id: this.customer },
        {
          $pull: {
            devices: {
              platform: this.platform,
            },
          },
        },
      );

      await customerModel.findOneAndUpdate(
        { _id: this.customer },
        {
          $addToSet: {
            devices: customerDevice,
          },
        },
      );
    } catch (error) {
      new Logger('CustomerFCMTokenSchema').error('Failed to update customer devices: ' + error?.message, { error });
    }
  });

  const customerFCMTokenModel = connection.model(ModelNames.CUSTOMER_FCM_TOKEN, CustomerFCMTokenSchema);

  return customerFCMTokenModel;
}
