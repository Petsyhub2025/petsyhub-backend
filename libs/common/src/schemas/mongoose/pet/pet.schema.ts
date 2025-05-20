import { ModelNames, RabbitExchanges, RabbitRoutingKeys } from '@common/constants';
import { DeepLinkModelsEnum } from '@common/enums';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { DeepLinkService, FirebaseDynamicLinkService } from '@common/helpers/services';
import { IElasticSyncFieldUpdatePropagationEvent } from '@common/interfaces/rabbitmq/events/elasticsync';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from '@songkeys/nestjs-redis';
import { Schema, Connection, HydratedDocument } from 'mongoose';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { DynamicLinkSchema } from '@common/schemas/mongoose/common/dynamic-link';
import { PetGenderEnum, PetEventsEnum, PetStatusEnum } from './pet.enum';
import { Pet, IPetModel, IPetInstanceMethods } from './pet.type';
import { Logger } from '@nestjs/common';
import { OwnedPetsSubSchemaType } from '@common/schemas/mongoose/user/user-subschemas/owned-pets';
import { v4 as uuidV4, v5 as uuidV5 } from 'uuid';
import { PetUserSchema } from './subschemas/pet-user/pet-user.schema';
import { MediaSchema } from '@common/schemas/mongoose/common/media';

const PetSchema = new Schema<Pet, IPetModel, IPetInstanceMethods>(
  {
    privateId: {
      type: String,
      required: true,
    },

    user: {
      type: PetUserSchema,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    profilePictureMedia: {
      type: MediaSchema,
      required: false,
    },

    profilePictureMediaProcessingId: {
      type: String,
      required: false,
    },

    breed: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: ModelNames.PET_BREED,
    },

    type: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: ModelNames.PET_TYPE,
    },

    bio: {
      type: String,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: PetStatusEnum,
      required: false,
    },

    gender: {
      type: String,
      enum: PetGenderEnum,
    },

    birthDate: {
      type: String,
      required: true,
    },

    height: {
      type: Number,
      min: 1,
      max: 200,
    },

    passportNumber: {
      type: Number,
    },

    isPrivate: {
      type: Boolean,
      default: false,
    },

    isLost: {
      type: Boolean,
      default: false,
    },

    weight: {
      type: Number,
      min: 1,
      max: 500,
    },

    totalFollowers: {
      type: Number,
      default: 0,
    },

    totalPosts: {
      type: Number,
      default: 0,
    },

    ...DynamicLinkSchema,
    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function petSchemaFactory(
  connection: Connection,
  eventEmitter: EventEmitter2,
  redisService: RedisService,
  amqpConnection: AmqpConnection,
  deepLinkService: DeepLinkService,
  firebaseDynamicLinkService: FirebaseDynamicLinkService,
) {
  PetSchema.index({ 'user.userId': 1 });
  PetSchema.index({ 'user.country': 1 });
  PetSchema.index({ 'user.city': 1 });
  PetSchema.index({ isPrivate: 1 });
  PetSchema.index({ isViewable: 1 });
  PetSchema.index({ _id: -1, isViewable: 1 });
  PetSchema.index({ 'user.userId': 1, isPrivate: 1 });
  PetSchema.index({ type: 1 });
  PetSchema.index({ breed: 1 });
  PetSchema.index({ profilePictureMediaProcessingId: 1 });

  PetSchema.pre('validate', function (next) {
    if (!this.privateId) {
      this.privateId = uuidV5(uuidV4(), uuidV4());
    }

    next();
  });

  PetSchema.pre('validate', async function () {
    const deepLink = deepLinkService.generateUserDeepLink({
      modelName: DeepLinkModelsEnum.PETS,
      modelId: this._id.toString(),
    });

    const dynamicLink = await firebaseDynamicLinkService.generateFirebaseDynamicLink<Pet>(
      this,
      ['name', 'profilePictureMedia', 'bio'],
      {
        link: deepLink,
        title: this.name,
        description: this.bio,
        imageUrl: this.profilePictureMedia?.url,
      },
    );

    this.dynamicLink = dynamicLink;
  });

  PetSchema.pre('validate', function (next) {
    this.isViewable = !this.deletedAt && !this.suspendedAt && !this.suspendedDueToUserSuspensionAt;
    next();
  });

  PetSchema.pre('validate', async function () {
    await validateSchema(this, Pet);
  });

  PetSchema.pre('save', async function () {
    this.wasNew = this.isNew;
    this.hasElasticFieldUpdate = this.isModified('name');
  });

  PetSchema.post('save', async function () {
    if (this.wasNew || !this.hasElasticFieldUpdate) return;

    await amqpConnection.publish<IElasticSyncFieldUpdatePropagationEvent>(
      RabbitExchanges.SERVICE,
      RabbitRoutingKeys.ELASTICSEARCH_SYNC_EVENTS_PROPAGATE_FIELD_UPDATE,
      { _id: this._id.toString(), model: ModelNames.PET },
    );
  });

  PetSchema.post('save', async function () {
    if (!this.wasNew) return;

    eventEmitter.emit(PetEventsEnum.POST_SAVE_UPDATE_USER_COUNTS, this);
  });

  PetSchema.post('save', async function () {
    const userModel = connection.model(ModelNames.USER);

    try {
      const ownedPet: OwnedPetsSubSchemaType = {
        petId: this._id,
        type: this.type,
        status: this.status,
      };
      await validateSchema(ownedPet, OwnedPetsSubSchemaType);
      await userModel.findOneAndUpdate(
        { _id: this.user.userId },
        {
          $addToSet: {
            ownedPets: ownedPet,
          },
        },
      );
    } catch (error) {
      new Logger('PetSchema').error('Failed to update user ownedPets: ' + error?.message, { error });
    }
  });

  PetSchema.methods.deleteDoc = async function (this: HydratedDocument<Pet>) {
    this.deletedAt = new Date();
    await this.save();

    eventEmitter.emit(PetEventsEnum.DELETE_DOC, this);
  };

  PetSchema.methods.suspendDocDueToUserSuspension = async function (this: HydratedDocument<Pet>) {
    this.suspendedDueToUserSuspensionAt = new Date();
    await this.save();

    eventEmitter.emit(PetEventsEnum.SUSPEND_DOC_DUE_TO_SUSPENSION_AT, this);
  };

  PetSchema.methods.unSuspendDocDueToUserSuspension = async function (this: HydratedDocument<Pet>) {
    this.suspendedDueToUserSuspensionAt = null;
    await this.save();

    eventEmitter.emit(PetEventsEnum.UN_SUSPEND_DOC_DUE_TO_SUSPENSION_AT, this);
  };

  const petModel = connection.model(ModelNames.PET, PetSchema);

  return petModel;
}
