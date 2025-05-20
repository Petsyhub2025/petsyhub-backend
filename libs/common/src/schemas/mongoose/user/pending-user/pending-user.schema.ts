import { ModelNames } from '@common/constants';
import bcrypt from 'bcrypt';
import { Connection, Schema } from 'mongoose';
import { UserSchema } from '../user.schema';
import { IPendingUserInstanceMethods, IPendingUserModel, PendingUser } from './pending-user.type';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';

const { email, password } = UserSchema.obj;

const PendingUserSchema = new Schema<PendingUser, IPendingUserModel, IPendingUserInstanceMethods>(
  {
    email,
    password,
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
  },
  {
    timestamps: true,
  },
);

export function pendingUserSchemaFactory(connection: Connection) {
  PendingUserSchema.index({ email: 1 });

  PendingUserSchema.pre('validate', async function () {
    await validateSchema(this, PendingUser);
  });

  PendingUserSchema.pre('save', async function () {
    if (!this.isModified('password')) {
      return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  });

  const pendingUserModel = connection.model(ModelNames.PENDING_USER, PendingUserSchema);

  return pendingUserModel;
}
