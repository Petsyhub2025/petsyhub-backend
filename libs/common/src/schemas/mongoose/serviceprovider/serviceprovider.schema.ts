import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import bcrypt from 'bcrypt';
import { Connection, HydratedDocument, Schema } from 'mongoose';
import { IServiceProviderInstanceMethods, IServiceProviderModel, ServiceProvider } from './serviceprovider.type';

export const ServiceProviderSchema = new Schema<
  ServiceProvider,
  IServiceProviderModel,
  IServiceProviderInstanceMethods
>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: false,
    },

    phoneNumber: { type: String, required: true },

    anotherPhoneNumber: { type: String, required: false },

    isSelfResetPassword: { type: Boolean, default: false },

    ...BaseSchema,
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
      },
    },
  },
);

export function serviceProviderSchemaFactory(connection: Connection) {
  ServiceProviderSchema.index({ email: 1 });

  ServiceProviderSchema.pre('validate', async function () {
    await validateSchema(this, ServiceProvider);
  });

  ServiceProviderSchema.pre('save', async function () {
    if (!this.isModified('password')) {
      return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  });

  ServiceProviderSchema.methods.comparePassword = async function (
    this: HydratedDocument<ServiceProvider>,
    password: string,
  ) {
    return bcrypt.compare(password, this.password);
  };

  const serviceProviderModel = connection.model(ModelNames.SERVICE_PROVIDER, ServiceProviderSchema);

  return serviceProviderModel;
}
