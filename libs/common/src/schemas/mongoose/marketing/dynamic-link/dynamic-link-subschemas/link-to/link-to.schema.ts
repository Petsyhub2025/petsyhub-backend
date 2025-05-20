import { ShareableDeepLinkModelsEnum } from '@common/enums';
import { Schema } from 'mongoose';
import { DynamicLinkLinkToSubSchemaType } from './link-to.type';

export const DynamicLinkLinkToSubSchema = new Schema<DynamicLinkLinkToSubSchemaType>(
  {
    modelType: {
      type: String,
      enum: ShareableDeepLinkModelsEnum,
      required: true,
    },

    modelIdentifier: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);
