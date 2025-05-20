import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { ClientSession, Connection, Schema } from 'mongoose';
import { MediaSchema } from '@common/schemas/mongoose/common/media';
import { DynamicLinkLinkToSubSchema } from './dynamic-link-subschemas/link-to';
import { DynamicLink, IDynamicLinkInstanceMethods, IDynamicLinkModel } from './dynamic-link.type';
import { DynamicLinkSchema as _DynamicLinkSchema } from '@common/schemas/mongoose/common/dynamic-link';
import { AppConfig } from '@common/modules/env-config/services/app-config';
import { DeepLinkService, FirebaseDynamicLinkService } from '@common/helpers/services';

const DynamicLinkSchema = new Schema<DynamicLink, IDynamicLinkModel, IDynamicLinkInstanceMethods>(
  {
    linkedTo: {
      type: DynamicLinkLinkToSubSchema,
      required: false,
    },

    title: {
      type: String,
      required: true,
      maxlength: 100,
    },

    previewTitle: {
      type: String,
      required: true,
      maxlength: 100,
    },

    previewDescription: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    previewMedia: {
      type: MediaSchema,
      required: true,
    },

    previewMediaProcessingId: {
      type: String,
      required: false,
    },

    linkedMedia: {
      type: MediaSchema,
      required: false,
    },

    useLinkedMedia: {
      type: Boolean,
      required: true,
    },

    deepLink: {
      type: String,
      required: true,
    },

    isArchived: {
      type: Boolean,
      required: false,
      default: false,
    },

    ...BaseSchema,
    ..._DynamicLinkSchema,
  },
  {
    timestamps: true,
  },
);

export function dynamicLinkSchemaFactory(
  connection: Connection,
  appConfig: AppConfig,
  deepLinkService: DeepLinkService,
  firebaseDynamicLinkService: FirebaseDynamicLinkService,
) {
  DynamicLinkSchema.index({ 'linkedTo.modelType': 1 });
  DynamicLinkSchema.index({ previewMediaProcessingId: 1 });
  DynamicLinkSchema.index({ title: 1 }, { unique: true });

  DynamicLinkSchema.pre('validate', async function () {
    this.previewMedia = this.linkedMedia ?? this.previewMedia;
  });

  DynamicLinkSchema.pre('validate', async function () {
    if (!this.previewMedia) {
      throw new Error('A type of Media is required, either previewMedia or linkedMedia');
    }

    let deepLink: string = appConfig.FIREBASE_USER_DEFAULT_DEEP_LINK;

    if (this.linkedTo) {
      deepLink = deepLinkService.generateUserDeepLink({
        modelName: this.linkedTo.modelType,
        modelId: this.linkedTo.modelIdentifier,
      });
    }

    const dynamicLink = await firebaseDynamicLinkService.generateFirebaseDynamicLink(
      this,
      ['previewTitle', 'previewDescription', 'previewMedia', 'linkedTo.modelType' as any, 'linkedTo.modelIdentifier'],
      {
        link: deepLink,
        title: this.previewTitle,
        description: this.previewDescription,
        imageUrl: this.previewMedia.url,
      },
    );

    this.deepLink = deepLink;
    this.dynamicLink = dynamicLink;
  });

  DynamicLinkSchema.pre('validate', async function () {
    await validateSchema(this, DynamicLink);
  });

  DynamicLinkSchema.methods.deleteDoc = async function (this: Hydrate<DynamicLink>, _session?: ClientSession) {
    if (_session) {
      await _deleteDoc.call(this, _session);
      return;
    }

    const session = await connection.startSession();
    session.startTransaction({
      readPreference: 'primary',
    });

    try {
      await _deleteDoc.call(this, session);
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();

      throw error;
    } finally {
      session.endSession();
    }
  };

  async function _deleteDoc(this: Hydrate<DynamicLink>, session?: ClientSession) {
    this.deletedAt = new Date();
    await this.save({ session });
  }

  const dynamicLinkModel = connection.model(ModelNames.DYNAMIC_LINK, DynamicLinkSchema);

  return dynamicLinkModel;
}
