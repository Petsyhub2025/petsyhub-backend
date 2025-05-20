import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { Schema, Connection } from 'mongoose';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { PointLocationSchema } from '@common/schemas/mongoose/common/point';
import { CustomerAddress, ICustomerAddressModel, ICustomerAddressInstanceMethods } from './customer-address.type';
import { CustomerAddressTypeEnum } from './customer-address.enum';

const CustomerAddressSchema = new Schema<CustomerAddress, ICustomerAddressModel, ICustomerAddressInstanceMethods>(
  {
    country: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.COUNTRY,
      required: true,
    },

    city: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.CITY,
      required: true,
    },

    area: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.AREA,
      required: false,
    },

    location: {
      type: PointLocationSchema,
      index: '2dsphere',
      required: true,
    },

    streetName: { type: String, required: true },

    customer: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.CUSTOMER,
      required: true,
    },

    phoneNumber: { type: String, required: true },

    addressType: { type: String, enum: CustomerAddressTypeEnum, required: true },

    buildingName: { type: String, required: false },

    additionalNotes: { type: String, required: false },
    apartmentNumber: { type: Number, required: false },
    companyName: { type: String, required: false },
    floor: { type: String, required: false },
    houseName: { type: String, required: false },
    isDefault: { type: Boolean, required: false, default: false },
    labelName: { type: String, required: false },
    landMark: { type: String, required: false },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function customerAddressSchemaFactory(connection: Connection) {
  CustomerAddressSchema.index({ country: 1 });
  CustomerAddressSchema.index({ city: 1 });
  CustomerAddressSchema.index({ country: 1, city: 1 });
  CustomerAddressSchema.index({ customer: 1 });
  CustomerAddressSchema.index({ area: 1 });

  CustomerAddressSchema.pre('validate', async function () {
    await validateSchema(this, CustomerAddress);
  });

  const customerAddressModel = connection.model(ModelNames.CUSTOMER_ADDRESS, CustomerAddressSchema);

  return customerAddressModel;
}
