import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { Schema, Connection } from 'mongoose';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { PointLocationSchema } from '@common/schemas/mongoose/common/point';
import { UserAddress, IUserAddressModel, IUserAddressInstanceMethods } from './user-address.type';

const UserAddressSchema = new Schema<UserAddress, IUserAddressModel, IUserAddressInstanceMethods>(
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

    isPendingAddress: {
      type: Boolean,
      default: false,
    },

    location: {
      type: PointLocationSchema,
      required: function (this: UserAddress) {
        return !this.isPendingAddress;
      },
      index: '2dsphere',
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.USER,
      required: true,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function userAddressSchemaFactory(connection: Connection) {
  UserAddressSchema.index({ country: 1 });
  UserAddressSchema.index({ city: 1 });
  UserAddressSchema.index({ country: 1, city: 1 });
  UserAddressSchema.index({ user: 1, isPendingAddress: 1 });

  UserAddressSchema.pre('validate', async function () {
    await validateSchema(this, UserAddress);
  });

  const userAddressModel = connection.model(ModelNames.USER_ADDRESS, UserAddressSchema);

  return userAddressModel;
}
