import { CustomError } from '@common/classes/custom-error.class';
import { ModelNames, RabbitExchanges, RabbitRoutingKeys } from '@common/constants';
import { DeepLinkModelsEnum, ErrorType, UserFcmTopicsEnum } from '@common/enums';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { DeepLinkService, FirebaseDynamicLinkService } from '@common/helpers/services';
import { IElasticSyncFieldUpdatePropagationEvent } from '@common/interfaces/rabbitmq/events/elasticsync';
import { IUnsuspendEvent } from '@common/interfaces/rabbitmq/events/message-worker';
import { ISubscribeUserToTopicRpc, IUnsubscribeUserFromTopicRpc } from '@common/interfaces/rabbitmq/rpc/notifications';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { DynamicLinkSchema } from '@common/schemas/mongoose/common/dynamic-link';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from '@songkeys/nestjs-redis';
import bcrypt from 'bcrypt';
import { Connection, HydratedDocument, Schema } from 'mongoose';
import { UserHelperService } from './user-helper.service';
import { OwnedPetsSubSchema } from './user-subschemas/owned-pets';
import { UserDevicesSubSchema } from './user-subschemas/user-devices';
import { UserSettingsLanguageEnum, UserSettingsSubSchema } from './user-subschemas/user-settings';
import { BlockedReasonEnum, UserEventsEnum, UserGenderEnum, UserRoleEnum, UserSocketStatusEnum } from './user.enum';
import { IUserInstanceMethods, IUserModel, User } from './user.type';
import { catchError, from, lastValueFrom, mergeMap, of } from 'rxjs';
import { languageToTopicMap, userLanguageToFcmTopicsMapper } from '@common/helpers/user-fcm-topics-mapper.helper';
import { MediaSchema } from '@common/schemas/mongoose/common/media';

export const UserSchema = new Schema<User, IUserModel, IUserInstanceMethods>(
  {
    username: {
      type: String,
      required: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: false,
    },

    googleId: {
      type: String,
      required: false,
    },

    appleId: {
      type: String,
      required: false,
    },

    bio: {
      type: String,
      required: false,
    },

    birthDate: {
      type: String,
      required: false,
    },

    birthDateTimestamp: {
      type: Number,
      required: false,
    },

    gender: {
      type: String,
      enum: UserGenderEnum,
      required: false,
    },

    profilePictureMedia: {
      type: MediaSchema,
      required: false,
    },

    profilePictureMediaProcessingId: {
      type: String,
      required: false,
    },

    activeAddress: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.USER_ADDRESS,
      required: false,
    },

    isPrivate: {
      type: Boolean,
      default: false,
    },

    isDiscoverable: {
      type: Boolean,
      default: true,
    },

    ownedPets: {
      type: [OwnedPetsSubSchema],
      required: false,
      default: [],
    },

    devices: {
      type: [UserDevicesSubSchema],
      required: false,
      default: [],
    },

    totalPosts: {
      type: Number,
      default: 0,
    },

    totalFollowers: {
      type: Number,
      default: 0,
    },

    totalUserFollowings: {
      type: Number,
      default: 0,
    },

    totalPetFollowings: {
      type: Number,
      default: 0,
    },

    totalPets: {
      type: Number,
      default: 0,
    },

    totalReports: {
      type: Number,
      default: 0,
    },

    totalEventsAttended: {
      type: Number,
      default: 0,
    },

    totalEventsHosted: {
      type: Number,
      default: 0,
    },

    settings: {
      type: UserSettingsSubSchema,
      required: false,
      default: {
        language: UserSettingsLanguageEnum.EN,
      },
    },

    role: {
      type: String,
      enum: UserRoleEnum,
      default: UserRoleEnum.ACTIVE,
    },

    blockedAt: {
      type: Date,
      default: null,
    },

    blockReason: {
      type: String,
      enum: BlockedReasonEnum,
      required: false,
    },

    blockDuration: {
      type: Number,
      default: 0,
    },

    isDoneOnboarding: {
      type: Boolean,
      default: false,
    },

    socketId: {
      type: String,
      default: null,
    },

    socketStatus: {
      type: String,
      enum: UserSocketStatusEnum,
      default: UserSocketStatusEnum.OFFLINE,
    },

    lastSocketActiveDate: {
      type: Date,
      default: null,
    },

    currentRooms: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: ModelNames.BASE_CHAT_ROOM,
    },

    // TODO: Remove this when address component is done
    country: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.COUNTRY,
      required: false,
    },

    city: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.CITY,
      required: function (this: HydratedDocument<User>) {
        return !!this.country;
      },
    },

    area: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.AREA,
      required: false,
    },

    ...DynamicLinkSchema,
    ...BaseSchema,
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
      },
    },
  },
);

export function userSchemaFactory(
  connection: Connection,
  userHelperService: UserHelperService,
  eventEmitter: EventEmitter2,
  deepLinkService: DeepLinkService,
  firebaseDynamicLinkService: FirebaseDynamicLinkService,
  redisService: RedisService,
  amqpConnection: AmqpConnection,
) {
  UserSchema.index({ username: 1 });
  UserSchema.index({ email: 1 });
  UserSchema.index({ country: 1 });
  UserSchema.index({ city: 1 });
  UserSchema.index({ area: 1 });
  UserSchema.index({ isViewable: 1 });
  UserSchema.index({ _id: -1, isViewable: 1 });
  UserSchema.index({ profilePictureMediaProcessingId: 1 });

  UserSchema.pre('validate', async function () {
    if (!this.isNew) {
      return;
    }

    if (!this.firstName && !this.lastName) {
      this.firstName = 'new';
      this.lastName = 'user';
    }
  });

  UserSchema.pre('validate', async function () {
    if (!this.isNew) {
      return;
    }

    const firstName = this.firstName
      .toLowerCase()
      .trim()
      .replace(/[^A-Z0-9]/gi, '');
    const lastName = this.lastName
      ?.toLowerCase()
      ?.trim()
      ?.replace(/[^A-Z0-9]/gi, '');

    if (!firstName && !lastName) {
      this.username = 'user' + new Date().getTime();
      return;
    }

    const username = `${firstName || ''}${lastName || ''}`;

    const usernameExists = await userModel.exists({ username });

    if (usernameExists) {
      const _username = username + (Math.floor(new Date().getTime() / 1000) + Math.floor(Math.random() * 10000));
      this.username = _username.substring(0, 24);
      return;
    }

    this.username = username;
  });

  UserSchema.pre('validate', async function () {
    const deepLink = deepLinkService.generateUserDeepLink({
      modelName: DeepLinkModelsEnum.USERS,
      modelId: this.username,
    });

    const dynamicLink = await firebaseDynamicLinkService.generateFirebaseDynamicLink<User>(
      this,
      ['username', 'profilePictureMedia', 'bio', 'firstName', 'lastName'],
      {
        link: deepLink,
        title: this.firstName + ' ' + this.lastName,
        description: this.bio,
        imageUrl: this.profilePictureMedia?.url,
      },
    );

    this.dynamicLink = dynamicLink;
  });

  UserSchema.pre('validate', function (next) {
    this.isViewable = !this.deletedAt && !this.suspendedAt && this.isDoneOnboarding;
    next();
  });

  UserSchema.pre('validate', async function () {
    await validateSchema(this, User);
  });

  UserSchema.pre('save', async function () {
    this.wasNew = this.isNew;
    this.hasElasticFieldUpdate = this.isModified(['firstName', 'lastName', 'username']);
    this.hasUpdatedLanguage = this.isModified('settings.language');
    this.hasUpdatedLocation = this.isModified(['country', 'city', 'area']);
  });

  UserSchema.pre('save', async function () {
    if (!this.isModified('birthDate')) return;

    const parts = this.birthDate.split('-');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    const date = new Date(year, month, day);

    this.birthDateTimestamp = date.getTime();
  });

  UserSchema.pre('save', async function () {
    if (!this.isModified('password')) {
      return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  });

  UserSchema.post('save', async function () {
    if (this.wasNew || !this.hasElasticFieldUpdate) return;

    await amqpConnection.publish<IElasticSyncFieldUpdatePropagationEvent>(
      RabbitExchanges.SERVICE,
      RabbitRoutingKeys.ELASTICSEARCH_SYNC_EVENTS_PROPAGATE_FIELD_UPDATE,
      { _id: this._id.toString(), model: ModelNames.USER },
    );
  });

  UserSchema.post('save', async function (this: Hydrate<User>) {
    if (!this.hasUpdatedLanguage) return;

    const currentLanguage = this.settings.language;
    const topicsToUnsubscribe = Object.keys(languageToTopicMap)
      .filter((key) => key !== currentLanguage)
      .flatMap((key: UserSettingsLanguageEnum) => userLanguageToFcmTopicsMapper(key));
    const topicsToSubscribe = userLanguageToFcmTopicsMapper(currentLanguage);

    const userFcmTokenModel = connection.model(ModelNames.USER_FCM_TOKEN);
    const userFcmTokens = await userFcmTokenModel.find({ user: this._id }, { fcmToken: 1 }).lean();

    from(
      handleUserTopicSubscriptionsOnLanguageUpdate(
        topicsToUnsubscribe,
        topicsToSubscribe,
        userFcmTokens.map((_) => _.fcmToken),
      ),
    ).subscribe();
  });

  UserSchema.post('save', async function () {
    if (!this.hasUpdatedLocation) return;

    const petModel = connection.model(ModelNames.PET);

    const pets = petModel.find({ 'user.userId': this._id }).cursor();
    const { country, city, area } = this;

    for await (const pet of pets) {
      pet.set({
        user: {
          ...pet.user,
          country,
          city,
          area,
        },
      });
      await pet.save();
    }
  });

  UserSchema.methods.comparePassword = async function (this: HydratedDocument<User>, password: string) {
    return bcrypt.compare(password, this.password);
  };

  UserSchema.methods.getActiveAddress = userHelperService.getActiveAddress;

  UserSchema.methods.deleteDoc = async function (this: HydratedDocument<User>) {
    this.deletedAt = new Date();
    await this.save();

    eventEmitter.emit(UserEventsEnum.DELETE_DOC, this);
  };

  UserSchema.methods.suspendDoc = async function (this: HydratedDocument<User>) {
    this.suspendedAt = new Date();
    this.role = UserRoleEnum.SUSPENDED;
    await this.save();

    eventEmitter.emit(UserEventsEnum.SUSPEND_DOC, this);
  };

  UserSchema.methods.unSuspendDoc = async function (this: HydratedDocument<User>) {
    const redisClient = redisService.getClient();

    const existingUnSuspendRequest = await redisClient.sismember(
      RabbitRoutingKeys.MESSAGE_WORKER_EVENTS_UNSUSPEND_USER,
      this._id.toString(),
    );

    if (existingUnSuspendRequest) {
      throw new BadRequestException(
        new CustomError({
          localizedMessage: {
            en: 'User is already in un-suspend queue',
            ar: 'المستخدم موجود بالفعل في قائمة الغاء الحظر',
          },
          errorType: ErrorType.INVALID,
          event: 'USER_ALREADY_IN_UN_SUSPEND_QUEUE',
        }),
      );
    }

    await redisClient.sadd(RabbitRoutingKeys.MESSAGE_WORKER_EVENTS_UNSUSPEND_USER, this._id.toString());
    await amqpConnection.publish<IUnsuspendEvent>(
      RabbitExchanges.MESSAGE_WORKER,
      RabbitRoutingKeys.MESSAGE_WORKER_EVENTS_UNSUSPEND_USER,
      {
        _id: this._id.toString(),
      },
    );
  };

  UserSchema.methods._unSuspendDoc = async function (this: HydratedDocument<User>) {
    this.suspendedAt = null;
    this.role = UserRoleEnum.ACTIVE;
    await this.save();

    eventEmitter.emit(UserEventsEnum.UN_SUSPEND_DOC, this);
  };

  UserSchema.methods.blockDoc = async function (
    this: HydratedDocument<User>,
    blockDate: Date,
    blockReason: BlockedReasonEnum,
  ) {
    if (isNaN(blockDate.getTime()) || blockDate.getTime() < new Date().getTime()) {
      throw new InternalServerErrorException(
        new CustomError({
          localizedMessage: {
            en: 'Invalid block date',
            ar: 'تاريخ الحظر غير صالح',
          },
          errorType: ErrorType.INVALID,
          event: 'BLOCK_USER_INVALID_DATE',
        }),
      );
    }

    const now = new Date();
    const blockDuration = blockDate.getTime() - now.getTime();

    this.blockedAt = now;
    this.blockDuration = blockDuration;
    this.blockReason = blockReason;
    this.role = UserRoleEnum.BLOCKED;
    await this.save();
  };

  async function handleUserTopicSubscriptionsOnLanguageUpdate(
    topicsToUnsubscribe: UserFcmTopicsEnum[],
    topicsToSubscribe: UserFcmTopicsEnum[],
    fcmTokens: string[],
  ) {
    if (!fcmTokens?.length) return;

    if (topicsToUnsubscribe?.length) {
      await lastValueFrom(
        from(topicsToUnsubscribe).pipe(
          mergeMap((topic) =>
            from(
              amqpConnection.request({
                exchange: RabbitExchanges.SERVICE,
                routingKey: RabbitRoutingKeys.NOTIFICATION_RPC_USER_UNSUBSCRIBE_FROM_TOPIC,
                payload: { topic, fcmTokens } as IUnsubscribeUserFromTopicRpc,
              }),
            ).pipe(
              catchError((error) => {
                new Logger('UserSchema').error('Failed to unsubscribe user from topic', {
                  error,
                  fcmTokens,
                  userId: this._id.toString(),
                  topic,
                });
                return of(null);
              }),
            ),
          ),
        ),
      );
    }

    if (topicsToSubscribe?.length) {
      from(topicsToSubscribe)
        .pipe(
          mergeMap((topic) =>
            from(
              amqpConnection.request({
                exchange: RabbitExchanges.SERVICE,
                routingKey: RabbitRoutingKeys.NOTIFICATION_RPC_USER_SUBSCRIBE_TO_TOPIC,
                payload: { topic, fcmTokens } as ISubscribeUserToTopicRpc,
              }),
            ).pipe(
              catchError((error) => {
                new Logger('UserSchema').error('Failed to subscribe user to topic', {
                  error,
                  fcmTokens,
                  userId: this._id.toString(),
                  topic,
                });
                return of(null);
              }),
            ),
          ),
        )
        .subscribe();
    }
  }

  const userModel = connection.model(ModelNames.USER, UserSchema);

  return userModel;
}
