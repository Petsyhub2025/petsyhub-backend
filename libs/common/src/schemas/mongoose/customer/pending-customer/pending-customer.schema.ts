import { ModelNames } from '@common/constants';
import bcrypt from 'bcrypt';
import { Connection, Schema } from 'mongoose';
import { CustomerSchema } from '@common/schemas/mongoose/customer/customer.schema';
import { IPendingCustomerInstanceMethods, IPendingCustomerModel, PendingCustomer } from './pending-customer.type';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';

const { email, password, phoneNumber, firstName, lastName } = CustomerSchema.obj;

const PendingCustomerSchema = new Schema<PendingCustomer, IPendingCustomerModel, IPendingCustomerInstanceMethods>(
  {
    email,
    password,
    phoneNumber,
    firstName,
    lastName,
  },
  {
    timestamps: true,
  },
);

export function pendingCustomerSchemaFactory(connection: Connection) {
  PendingCustomerSchema.index({ email: 1 });

  PendingCustomerSchema.pre('validate', async function () {
    await validateSchema(this, PendingCustomer);
  });

  PendingCustomerSchema.pre('save', async function () {
    if (!this.isModified('password')) {
      return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  });

  const pendingCustomerModel = connection.model(ModelNames.PENDING_CUSTOMER, PendingCustomerSchema);

  return pendingCustomerModel;
}
