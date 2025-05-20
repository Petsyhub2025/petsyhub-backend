import { ModelNames } from '@common/constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientSession, HydratedDocument, Schema } from 'mongoose';
import { LostFoundPostTypeEnum } from '@common/schemas/mongoose/lost-found/base-lost-found-post.enum';
import { ILostPostInstanceMethods, ILostPostModel, LostPost } from './lost-post.type';
import { IBaseLostFoundPostModel } from '@common/schemas/mongoose/lost-found/base-lost-found-post.type';
import { DeepLinkModelsEnum } from '@common/enums';
import { Connection } from 'mongoose';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { DeepLinkService, FirebaseDynamicLinkService } from '@common/helpers/services';

const LostPostSchema = new Schema<LostPost, ILostPostModel, ILostPostInstanceMethods>(
  {
    pet: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.PET,
      required: true,
    },

    reward: {
      type: Number,
      min: 100,
      max: 999999,
    },

    isFound: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export function lostPostSchemaFactory(
  baseLostFoundPostModel: IBaseLostFoundPostModel,
  eventEmitter: EventEmitter2,
  connection: Connection,
  deepLinkService: DeepLinkService,
  firebaseDynamicLinkService: FirebaseDynamicLinkService,
) {
  LostPostSchema.pre('validate', async function () {
    const deepLink = deepLinkService.generateUserDeepLink({
      modelName: DeepLinkModelsEnum.LOST_POSTS,
      modelId: this._id.toString(),
    });

    const dynamicLink = await firebaseDynamicLinkService.generateFirebaseDynamicLink<LostPost>(this, ['description'], {
      link: deepLink,
      description: this.description,
      imageUrl: this.media?.[0]?.url,
    });

    this.dynamicLink = dynamicLink;
  });

  LostPostSchema.pre('validate', function (next) {
    this.isViewable = !this.deletedAt && !this.isFound && !this.suspendedDueToUserSuspensionAt && !this.suspendedAt;
    next();
  });

  LostPostSchema.pre('validate', async function () {
    await validateSchema(this, LostPost);
  });

  LostPostSchema.methods.suspendDoc = async function (this: HydratedDocument<LostPost>) {
    this.suspendedAt = new Date();
    await this.save();
  };

  LostPostSchema.methods.unSuspendDoc = async function (this: HydratedDocument<LostPost>) {
    this.suspendedAt = null;
    await this.save();
  };

  LostPostSchema.methods.deleteDoc = async function (this: HydratedDocument<LostPost>, _session?: ClientSession) {
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

  LostPostSchema.methods.suspendDocDueToUserSuspension = async function (this: HydratedDocument<LostPost>) {
    this.suspendedDueToUserSuspensionAt = new Date();
    await this.save();
  };

  LostPostSchema.methods.unSuspendDocDueToUserSuspension = async function (this: HydratedDocument<LostPost>) {
    this.suspendedDueToUserSuspensionAt = null;
    await this.save();
  };

  async function _deleteDoc(this: HydratedDocument<LostPost>, session?: ClientSession) {
    this.deletedAt = new Date();
    await this.save({ session });
  }

  const lostPostModel = baseLostFoundPostModel.discriminator(
    ModelNames.LOST_POST,
    LostPostSchema,
    LostFoundPostTypeEnum.LOST,
  );

  return lostPostModel;
}
