import { Connection, HydratedDocument, Schema } from 'mongoose';
import { IShippingConfigInstanceMethods, IShippingConfigModel, ShippingConfig } from './shipping-config.type';
import { ModelNames } from '@common/constants';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { EstimationArrivalUnitEnum } from '@common/schemas/mongoose/branch/base-branch.enum';

const ShippingConfigSchema = new Schema<ShippingConfig, IShippingConfigModel, IShippingConfigInstanceMethods>(
  {
    shippingFee: { type: Number, required: true },
    estimatedArrivalTime: { type: Number, required: true },
    tax: { type: Number, required: true },
    estimatedArrivalUnit: { type: String, enum: EstimationArrivalUnitEnum, required: true },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function shippingConfigSchemaFactory(connection: Connection) {
  ShippingConfigSchema.pre('validate', async function () {
    await validateSchema(this, ShippingConfig);
  });

  ShippingConfigSchema.methods.deleteDoc = async function (this: HydratedDocument<ShippingConfig>) {
    await this.deleteOne();
  };

  const shippingConfigModel = connection.model(ModelNames.SHIPPING_CONFIG, ShippingConfigSchema);

  return shippingConfigModel;
}
