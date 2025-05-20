import { Schema, Types, modelNames } from 'mongoose';
import { AdminRoleSubSchemaType } from './admin-role.type';
import { ModelNames } from '@common/constants';

export const AdminRoleSubSchema = new Schema<AdminRoleSubSchemaType>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.ADMIN_ROLE,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
    timestamps: false,
  },
);
