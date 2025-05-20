import { Schema } from 'mongoose';
import { AdminSettingsSubSchemaType, AdminUpdateSubscriptionsSubSchemaType } from './admin-settings.type';
import { AdminUpdateSubscriptionsEnum } from './admin-settings.enum';

const AdminUpdatesSubscriptionsSubSchema = new Schema<AdminUpdateSubscriptionsSubSchemaType>(
  {
    [AdminUpdateSubscriptionsEnum.APPOINTMENT_UPDATES]: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    _id: false,
    timestamps: false,
  },
);

export const AdminSettingsSubSchema = new Schema<AdminSettingsSubSchemaType>(
  {
    updateSubscriptions: {
      type: AdminUpdatesSubscriptionsSubSchema,
      required: false,
      default: {},
    },
  },
  {
    _id: false,
    timestamps: false,
  },
);
