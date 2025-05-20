import { Schema } from 'mongoose';
import { CustomerSettingsSubSchemaType } from './customer-settings.type';
import { CustomerSettingsLanguageEnum } from './customer-settings.enum';

export const CustomerSettingsSubSchema = new Schema<CustomerSettingsSubSchemaType>(
  {
    language: {
      type: String,
      enum: CustomerSettingsLanguageEnum,
      default: CustomerSettingsLanguageEnum.EN,
      set: function (this: CustomerSettingsSubSchemaType, value: string) {
        this._previousLanguage = this.language;
        return value;
      },
    },
  },
  {
    _id: false,
    timestamps: false,
  },
);
