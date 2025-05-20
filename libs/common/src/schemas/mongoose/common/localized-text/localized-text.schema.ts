import { Schema, SchemaDefinition, SchemaTypeOptions } from 'mongoose';
import { LocalizedText } from './localized-text.type';

export type LocalizedTextSchemaOptions = SchemaTypeOptions<string>;

const defaultLocalizedTextSchemaOptions: LocalizedTextSchemaOptions = {
  minlength: 0,
  maxlength: 200,
  trim: true,
  required: true,
};

export function LocalizedTextSchema(options: LocalizedTextSchemaOptions = defaultLocalizedTextSchemaOptions) {
  const localizedTextSchemaDefinition: SchemaDefinition = {
    en: {
      type: String,
      ...defaultLocalizedTextSchemaOptions,
      ...options,
    },

    ar: {
      type: String,
      ...defaultLocalizedTextSchemaOptions,
      ...options,
    },
  };

  return new Schema<LocalizedText>(localizedTextSchemaDefinition, { _id: false });
}
