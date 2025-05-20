import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { Schema, Connection, HydratedDocument } from 'mongoose';
import { Admin, IAdminModel, IAdminInstanceMethods } from './admin.type';
import { BaseSchema } from '../base/base-schema';
import { AdminPermissionSchema } from './admin-permissions';
import { AdminRoleSubSchema } from './admin-subschemas/admin-role';
import { AdminSettingsSubSchema } from './admin-subschemas/admin-settings';

export const AdminSchema = new Schema<Admin, IAdminModel, IAdminInstanceMethods>(
  {
    email: {
      type: String,
      required: true,
    },

    googleId: {
      type: String,
      required: false,
    },

    firstName: {
      type: String,
      required: true,
    },

    lastName: {
      type: String,
      required: true,
    },

    permissions: {
      type: AdminPermissionSchema,
      required: true,
    },

    settings: {
      type: AdminSettingsSubSchema,
      required: false,
      default: {},
    },

    role: {
      type: AdminRoleSubSchema,
      required: true,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function adminSchemaFactory(connection: Connection) {
  AdminSchema.index({ email: 1 }, { unique: true });
  AdminSchema.index({ 'role._id': 1 });

  AdminSchema.pre('validate', async function () {
    await validateSchema(this, Admin);
  });

  AdminSchema.methods.deleteDoc = async function (this: HydratedDocument<Admin>) {
    this.deletedAt = new Date();
    await this.save();
  };

  const adminModel = connection.model(ModelNames.ADMIN, AdminSchema);

  return adminModel;
}
