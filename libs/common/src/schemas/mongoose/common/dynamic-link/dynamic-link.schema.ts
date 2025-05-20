import { SchemaDefinition, SchemaDefinitionType } from 'mongoose';
import { IDynamicLink } from './dynamic-link.type';

export const DynamicLinkSchema: SchemaDefinition<SchemaDefinitionType<IDynamicLink>> = {
  dynamicLink: {
    type: String,
    required: true,
  },
};
