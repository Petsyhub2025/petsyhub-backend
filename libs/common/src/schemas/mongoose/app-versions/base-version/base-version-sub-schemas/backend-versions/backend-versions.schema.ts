import { Schema } from 'mongoose';
import { BackEndVersionsSubSchemaType } from './backend-versions.type';

export const BackEndVersionsSubSchema = new Schema<BackEndVersionsSubSchemaType>(
  {
    users: {
      type: String,
      default: '1',
      required: true,
    },

    authentication: {
      type: String,
      default: '1',
      required: true,
    },

    pets: {
      type: String,
      default: '1',
      required: true,
    },

    posts: {
      type: String,
      default: '1',
      required: true,
    },

    engagement: {
      type: String,
      default: '1',
      required: true,
    },

    admins: {
      type: String,
      default: '1',
      required: true,
    },

    areas: {
      type: String,
      default: '1',
      required: true,
    },

    feed: {
      type: String,
      default: '1',
      required: true,
    },

    discovery: {
      type: String,
      default: '1',
      required: true,
    },

    search: {
      type: String,
      default: '1',
      required: true,
    },

    notifications: {
      type: String,
      default: '1',
      required: true,
    },

    moderation: {
      type: String,
      default: '1',
      required: true,
    },
    chat: {
      type: String,
      default: '1',
      required: true,
    },
    serviceproviders: {
      type: String,
      default: '1',
      required: true,
    },
    events: {
      type: String,
      default: '1',
      required: true,
    },
    topics: {
      type: String,
      default: '1',
      required: true,
    },
  },
  {
    _id: false,
    timestamps: false,
  },
);
