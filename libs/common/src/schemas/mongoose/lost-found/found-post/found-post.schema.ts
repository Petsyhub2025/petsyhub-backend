import { ModelNames } from '@common/constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientSession, HydratedDocument, Schema } from 'mongoose';
import { IFoundPostInstanceMethods, IFoundPostModel, FoundPost } from './found-post.type';
import { DeepLinkModelsEnum } from '@common/enums';
import { Connection } from 'mongoose';
import { IBaseLostFoundPostModel } from '@common/schemas/mongoose/lost-found/base-lost-found-post.type';
import { LostFoundPostTypeEnum } from '@common/schemas/mongoose/lost-found/base-lost-found-post.enum';
import { FoundPostPetSubSchema } from '@common/schemas/mongoose/lost-found/lost-found-subschemas/found-post-pet/found-post-pet.schema';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { DeepLinkService, FirebaseDynamicLinkService } from '@common/helpers/services';

const FoundPostSchema = new Schema<FoundPost, IFoundPostModel, IFoundPostInstanceMethods>(
  {
    foundPet: {
      type: FoundPostPetSubSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export function foundPostSchemaFactory(
  baseLostFoundPostModel: IBaseLostFoundPostModel,
  eventEmitter: EventEmitter2,
  connection: Connection,
  deepLinkService: DeepLinkService,
  firebaseDynamicLinkService: FirebaseDynamicLinkService,
) {
  FoundPostSchema.pre('validate', async function () {
    const deepLink = deepLinkService.generateUserDeepLink({
      modelName: DeepLinkModelsEnum.FOUND_POSTS,
      modelId: this._id.toString(),
    });

    const dynamicLink = await firebaseDynamicLinkService.generateFirebaseDynamicLink<FoundPost>(this, ['description'], {
      link: deepLink,
      description: this.description,
      imageUrl: this.media?.[0]?.url,
    });

    this.dynamicLink = dynamicLink;
  });

  FoundPostSchema.pre('validate', function (next) {
    this.isViewable = !this.deletedAt && !this.suspendedDueToUserSuspensionAt && !this.suspendedAt;
    next();
  });

  FoundPostSchema.pre('validate', async function () {
    await validateSchema(this, FoundPost);
  });

  FoundPostSchema.methods.suspendDoc = async function (this: HydratedDocument<FoundPost>) {
    this.suspendedAt = new Date();
    await this.save();
  };

  FoundPostSchema.methods.unSuspendDoc = async function (this: HydratedDocument<FoundPost>) {
    this.suspendedAt = null;
    await this.save();
  };

  FoundPostSchema.methods.deleteDoc = async function (this: HydratedDocument<FoundPost>, _session?: ClientSession) {
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

  FoundPostSchema.methods.suspendDocDueToUserSuspension = async function (this: HydratedDocument<FoundPost>) {
    this.suspendedDueToUserSuspensionAt = new Date();
    await this.save();
  };

  FoundPostSchema.methods.unSuspendDocDueToUserSuspension = async function (this: HydratedDocument<FoundPost>) {
    this.suspendedDueToUserSuspensionAt = null;
    await this.save();
  };

  async function _deleteDoc(this: HydratedDocument<FoundPost>, session?: ClientSession) {
    this.deletedAt = new Date();
    await this.save({ session });
  }

  const foundPostModel = baseLostFoundPostModel.discriminator(
    ModelNames.FOUND_POST,
    FoundPostSchema,
    LostFoundPostTypeEnum.FOUND,
  );

  return foundPostModel;
}
