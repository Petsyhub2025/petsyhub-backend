import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { Schema, Connection, HydratedDocument } from 'mongoose';
import { BaseSchema } from '../base/base-schema';
import { DynamicLinkSchema } from '../common/dynamic-link';
import { GooglePlacesLocationSubSchema } from '../common/google-places-location';
import { MediaSchema, Media } from '../common/media';
import {
  BaseLostFoundPost,
  IBaseLostFoundPostModel,
  IBaseLostFoundPostInstanceMethods,
} from './base-lost-found-post.type';

const BaseLostFoundPostSchema = new Schema<
  BaseLostFoundPost,
  IBaseLostFoundPostModel,
  IBaseLostFoundPostInstanceMethods
>(
  {
    authorUser: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.USER,
      required: true,
    },

    description: {
      type: String,
      required: true,
      maxlength: 3000,
    },

    locationData: {
      type: GooglePlacesLocationSubSchema,
      required: true,
    },

    media: {
      type: [MediaSchema],
      required: true,
      validate: {
        validator: (media: Media[]) => media.length >= 1 && media.length <= 3,
        message: 'Media must be between 1 and 3 items.',
      },
    },

    mediaProcessingId: {
      type: String,
      required: false,
    },

    ...BaseSchema,
    ...DynamicLinkSchema,
  },
  {
    discriminatorKey: 'postType',
    timestamps: true,
  },
);

export function baseLostFoundPostSchemaFactory(connection: Connection) {
  BaseLostFoundPostSchema.index({ authorUser: 1 });
  BaseLostFoundPostSchema.index({ createdAt: 1 });
  BaseLostFoundPostSchema.index({ postType: 1 });
  BaseLostFoundPostSchema.index({ pet: 1 });
  BaseLostFoundPostSchema.index({ mediaProcessingId: 1 });
  BaseLostFoundPostSchema.index({ 'locationData.location': '2dsphere' });
  BaseLostFoundPostSchema.index({ 'locationData.city': 1 });
  BaseLostFoundPostSchema.index({ 'locationData.city': 1, postType: 1 });
  BaseLostFoundPostSchema.index({ authorUser: 1, postType: 1 });
  BaseLostFoundPostSchema.index({ createdAt: 1, postType: 1 });
  BaseLostFoundPostSchema.index({ 'locationData.location': '2dsphere', postType: 1 });

  BaseLostFoundPostSchema.pre('validate', async function () {
    await validateSchema(this, BaseLostFoundPost);
  });

  BaseLostFoundPostSchema.methods.deleteDoc = async function (this: HydratedDocument<BaseLostFoundPost>) {
    await this.deleteOne();
  };

  const baseLostFoundPostModel = connection.model(ModelNames.BASE_LOST_FOUND_POST, BaseLostFoundPostSchema);

  return baseLostFoundPostModel;
}
