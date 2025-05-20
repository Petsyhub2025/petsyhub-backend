import { SchemaDefinition, SchemaDefinitionType } from 'mongoose';
import { BaseModel } from './base.type';

export const BaseSchema: SchemaDefinition<SchemaDefinitionType<BaseModel>> = {
  deletedAt: {
    type: Date,
    default: null,
  },

  suspendedAt: {
    type: Date,
    default: null,
  },

  suspendedDueToUserSuspensionAt: {
    type: Date,
    default: null,
  },

  isViewable: {
    type: Boolean,
    default: true,
  },
};
