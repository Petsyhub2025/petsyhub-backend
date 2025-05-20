import { ModelNames } from '@common/constants';
import bcrypt from 'bcrypt';
import { Connection, Schema } from 'mongoose';
import { ServiceProviderSchema } from '@common/schemas/mongoose/serviceprovider/serviceprovider.schema';
import {
  IPendingServiceProviderInstanceMethods,
  IPendingServiceProviderModel,
  PendingServiceProvider,
} from './pending-serviceprovider.type';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';

const { email, password, fullName, phoneNumber } = ServiceProviderSchema.obj;

const PendingServiceProviderSchema = new Schema<
  PendingServiceProvider,
  IPendingServiceProviderModel,
  IPendingServiceProviderInstanceMethods
>(
  {
    email,
    password,
    fullName,
    phoneNumber,
  },
  {
    timestamps: true,
  },
);

export function pendingServiceProviderSchemaFactory(connection: Connection) {
  PendingServiceProviderSchema.index({ email: 1 });

  PendingServiceProviderSchema.pre('validate', async function () {
    await validateSchema(this, PendingServiceProvider);
  });

  PendingServiceProviderSchema.pre('save', async function () {
    if (!this.isModified('password')) {
      return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  });

  const pendingServiceProviderModel = connection.model(
    ModelNames.PENDING_SERVICE_PROVIDER,
    PendingServiceProviderSchema,
  );

  return pendingServiceProviderModel;
}
