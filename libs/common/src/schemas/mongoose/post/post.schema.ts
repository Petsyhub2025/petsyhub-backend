import { CustomError } from '@common/classes/custom-error.class';
import { ModelNames, RabbitRoutingKeys, RabbitExchanges } from '@common/constants';
import { DeepLinkModelsEnum, ErrorType } from '@common/enums';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { DeepLinkService, FirebaseDynamicLinkService } from '@common/helpers/services';
import { IUnsuspendEvent } from '@common/interfaces/rabbitmq/events/message-worker';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from '@songkeys/nestjs-redis';
import { Schema, HydratedDocument, Connection } from 'mongoose';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { DynamicLinkSchema } from '@common/schemas/mongoose/common/dynamic-link';
import { MediaSchema } from '@common/schemas/mongoose/common/media';
import { PostCheckInLocationSchema } from './post-checkin-location';
import { PostEventsEnum } from './post.enum';
import { Post, IPostModel, IPostInstanceMethods } from './post.type';

const PostSchema = new Schema<Post, IPostModel, IPostInstanceMethods>(
  {
    authorUser: {
      type: Schema.Types.ObjectId,
      required: function (this: HydratedDocument<Post>) {
        return !this.authorPet;
      },
      ref: ModelNames.USER,
    },

    authorPet: {
      type: Schema.Types.ObjectId,
      required: function (this: HydratedDocument<Post>) {
        return !this.authorUser;
      },
      ref: ModelNames.PET,
    },

    authorPetOwnedByUser: {
      type: Schema.Types.ObjectId,
      required: function (this: HydratedDocument<Post>) {
        return !this.authorUser && !!this.authorPet;
      },
      ref: ModelNames.USER,
    },

    body: {
      type: String,
      required: false,
      maxlength: 2000,
    },

    isPrivate: {
      type: Boolean,
      default: false,
    },

    allowedUsers: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: ModelNames.USER,
    },

    hasAllowedUsers: {
      type: Boolean,
      default: false,
    },

    media: {
      type: [MediaSchema],
      required: true,
    },

    mediaProcessingId: {
      type: String,
      required: false,
    },

    checkInLocation: {
      type: PostCheckInLocationSchema,
      required: false,
    },

    taggedPets: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: ModelNames.PET,
    },

    taggedUsers: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: ModelNames.USER,
    },

    totalComments: {
      type: Number,
      default: 0,
    },

    totalLikes: {
      type: Number,
      default: 0,
    },

    totalShares: {
      type: Number,
      default: 0,
    },

    totalReports: {
      type: Number,
      default: 0,
    },

    topics: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: ModelNames.TOPIC,
    },

    ...DynamicLinkSchema,
    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function postSchemaFactory(
  connection: Connection,
  eventEmitter: EventEmitter2,
  deepLinkService: DeepLinkService,
  firebaseDynamicLinkService: FirebaseDynamicLinkService,
  redisService: RedisService,
  amqpConnection: AmqpConnection,
) {
  PostSchema.index({ createdAt: -1 });
  PostSchema.index({ authorUser: 1 });
  PostSchema.index({ authorPet: 1 });
  PostSchema.index({ isPrivate: 1 });
  PostSchema.index({ mediaProcessingId: 1 });
  PostSchema.index({ allowedUsers: 1 });
  PostSchema.index({ topics: 1 });
  PostSchema.index({ hasAllowedUsers: 1 });
  PostSchema.index({ taggedUsers: 1 });
  PostSchema.index({ taggedPets: 1 });
  PostSchema.index({ authorPetOwnedByUser: 1 });
  PostSchema.index({ 'checkInLocation.country': 1 });
  PostSchema.index({ 'checkInLocation.city': 1 });
  PostSchema.index({ isViewable: 1 });
  PostSchema.index({ _id: -1, isViewable: 1 });
  PostSchema.index({ authorUser: 1, createdAt: -1 });
  PostSchema.index({ authorPet: 1, createdAt: -1 });
  PostSchema.index({ isPrivate: 1, hasAllowedUsers: -1 });
  PostSchema.index({ authorUser: 1, hasAllowedUsers: -1 });
  PostSchema.index({ authorUser: 1, taggedPets: -1 });
  PostSchema.index({ authorUser: 1, taggedUsers: -1 });
  PostSchema.index({ authorUser: 1, isPrivate: 1, hasAllowedUsers: -1 });

  PostSchema.pre('validate', async function () {
    const deepLink = deepLinkService.generateUserDeepLink({
      modelName: DeepLinkModelsEnum.POSTS,
      modelId: this._id.toString(),
    });

    const dynamicLink = await firebaseDynamicLinkService.generateFirebaseDynamicLink<Post>(this, ['body', 'media'], {
      link: deepLink,
      title: 'Petsy',
      description: this.body,
      imageUrl: this.media?.[0]?.url,
    });

    this.dynamicLink = dynamicLink;
  });

  PostSchema.pre('validate', function (next) {
    this.isViewable = !this.deletedAt && !this.suspendedAt && !this.suspendedDueToUserSuspensionAt;
    next();
  });

  PostSchema.pre('validate', async function () {
    await validateSchema(this, Post);
  });

  PostSchema.pre('save', async function () {
    this.hasAllowedUsers = this.allowedUsers?.length > 0;
  });

  PostSchema.pre('save', async function () {
    this.wasNew = this.isNew;
  });

  PostSchema.post('save', async function () {
    if (!this.authorUser || !this.wasNew) return;

    eventEmitter.emit(PostEventsEnum.POST_SAVE_UPDATE_USER_COUNTS, this);
  });

  PostSchema.post('save', async function () {
    if (!this.authorPet || !this.wasNew) return;

    eventEmitter.emit(PostEventsEnum.POST_SAVE_UPDATE_PET_COUNTS, this);
  });

  PostSchema.methods.deleteDoc = async function (this: HydratedDocument<Post>) {
    this.deletedAt = new Date();
    this.topics = [];
    await this.save();

    eventEmitter.emit(PostEventsEnum.DELETE_DOC, this);
  };

  PostSchema.methods.suspendDoc = async function (this: HydratedDocument<Post>) {
    this.suspendedAt = new Date();
    await this.save();

    eventEmitter.emit(PostEventsEnum.SUSPEND_DOC, this);
  };

  PostSchema.methods.unSuspendDoc = async function (this: HydratedDocument<Post>) {
    const redisClient = redisService.getClient();

    const existingUnSuspendRequest = await redisClient.sismember(
      RabbitRoutingKeys.MESSAGE_WORKER_EVENTS_UNSUSPEND_POST,
      this._id.toString(),
    );

    if (existingUnSuspendRequest) {
      throw new BadRequestException(
        new CustomError({
          localizedMessage: {
            en: 'Post is already in un-suspend queue',
            ar: 'المنشور موجود بالفعل في قائمة الغاء الحظر',
          },
          errorType: ErrorType.INVALID,
          event: 'POST_ALREADY_IN_UN_SUSPEND_QUEUE',
        }),
      );
    }

    await redisClient.sadd(RabbitRoutingKeys.MESSAGE_WORKER_EVENTS_UNSUSPEND_POST, this._id.toString());
    await amqpConnection.publish<IUnsuspendEvent>(
      RabbitExchanges.MESSAGE_WORKER,
      RabbitRoutingKeys.MESSAGE_WORKER_EVENTS_UNSUSPEND_POST,
      {
        _id: this._id.toString(),
      },
    );
  };

  PostSchema.methods._unSuspendDoc = async function (this: HydratedDocument<Post>) {
    this.suspendedAt = null;
    await this.save();

    eventEmitter.emit(PostEventsEnum.UN_SUSPEND_DOC, this);
  };

  PostSchema.methods.suspendDocDueToUserSuspension = async function (this: HydratedDocument<Post>) {
    this.suspendedDueToUserSuspensionAt = new Date();
    await this.save();
  };

  PostSchema.methods.unSuspendDocDueToUserSuspension = async function (this: HydratedDocument<Post>) {
    this.suspendedDueToUserSuspensionAt = null;
    await this.save();
  };

  const postModel = connection.model(ModelNames.POST, PostSchema);

  return postModel;
}
