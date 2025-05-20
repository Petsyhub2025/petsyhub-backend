import { ModelNames } from '@common/constants';
import { DeepLinkModelsEnum } from '@common/enums';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { DeepLinkService, FirebaseDynamicLinkService } from '@common/helpers/services';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Schema, Connection, HydratedDocument, ClientSession } from 'mongoose';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { DynamicLinkSchema } from '@common/schemas/mongoose/common/dynamic-link';
import { MediaSchema } from '@common/schemas/mongoose/common/media';
import { EventAllowedPetTypeSubSchema } from './event-subschemas/event-allowed-pet-type';
import { EventPlaceLocationSubSchema } from './event-subschemas/event-place-location';
import { EventTypeEnum, EventEventListenerTypesEnum, EventStatusEnum } from './event.enum';
import { IEventModel, IEventInstanceMethods, IEventVirtuals, Event } from './event.type';
import { Logger } from '@nestjs/common';

const EventSchema = new Schema<Event, IEventModel, IEventInstanceMethods, Record<string, unknown>, IEventVirtuals>(
  {
    authorUser: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.USER,
      required: true,
    },

    title: {
      type: String,
      required: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
      maxlength: 3000,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    placeLocation: {
      type: EventPlaceLocationSubSchema,
      required: true,
    },

    type: {
      type: String,
      enum: EventTypeEnum,
      required: true,
    },

    cancelledAt: {
      type: Date,
      required: false,
    },

    cancellationReason: {
      type: String,
      required: false,
    },

    media: {
      type: [MediaSchema],
      required: true,
    },

    mediaProcessingId: {
      type: String,
      required: false,
    },

    allowedPetTypes: {
      type: [EventAllowedPetTypeSubSchema],
      required: true,
    },

    capacity: {
      type: Number,
      required: false,
      max: 1000000,
    },

    disableRsvpAtFullCapacity: {
      type: Boolean,
      required: false,
      default: false,
    },

    pricingInformation: {
      type: String,
      required: function (this: Hydrate<Event>) {
        return this.type === EventTypeEnum.PAID;
      },
      validate: {
        validator: function (this: Hydrate<Event>, v: string) {
          return this.type === EventTypeEnum.PAID ? v.length > 0 : false;
        },
        message: 'Pricing information is required for paid events',
      },
      maxlength: 10000,
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.EVENT_CATEGORY,
      required: true,
    },

    facilities: {
      type: [Schema.Types.ObjectId],
      ref: ModelNames.EVENT_FACILITY,
    },

    totalInterested: {
      type: Number,
      required: false,
      default: 0,
    },

    totalGoing: {
      type: Number,
      required: false,
      default: 0,
    },

    ...BaseSchema,
    ...DynamicLinkSchema,
  },
  {
    timestamps: true,
    toObject: {
      virtuals: true,
    },
    toJSON: {
      virtuals: true,
    },
  },
);

export function eventSchemaFactory(
  connection: Connection,
  deepLinkService: DeepLinkService,
  firebaseDynamicLinkService: FirebaseDynamicLinkService,
  eventEmitter: EventEmitter2,
) {
  EventSchema.index({ 'placeLocation.locationData.location': '2dsphere' });
  EventSchema.index({ authorUser: 1 });
  EventSchema.index({ category: 1 });
  EventSchema.index({ facilities: 1 });
  EventSchema.index({ type: 1 });
  EventSchema.index({ startDate: 1 });
  EventSchema.index({ endDate: 1 });
  EventSchema.index({ mediaProcessingId: 1 });
  EventSchema.index({ 'allowedPetTypes.petType': 1 });
  EventSchema.index({ 'allowedPetTypes.specificPetBreeds': 1 });
  EventSchema.index({ 'placeLocation.locationData.city': 1 });
  EventSchema.index({ startDate: 1, endDate: 1 });
  EventSchema.index({ category: 1, 'placeLocation.locationData.city': 1 });
  EventSchema.index({ facilities: 1, 'placeLocation.locationData.city': 1 });
  EventSchema.index({ type: 1, 'placeLocation.locationData.city': 1 });
  EventSchema.index({ startDate: 1, endDate: 1, 'placeLocation.locationData.city': 1 });
  EventSchema.index({ startDate: 1, endDate: 1, 'placeLocation.locationData.city': 1, 'allowedPetTypes.petType': 1 });
  EventSchema.index({
    startDate: 1,
    endDate: 1,
    'placeLocation.locationData.city': 1,
    'allowedPetTypes.specificPetBreeds': 1,
  });
  EventSchema.index({
    startDate: 1,
    endDate: 1,
    'placeLocation.locationData.city': 1,
    'allowedPetTypes.petType': 1,
    'allowedPetTypes.specificPetBreeds': 1,
  });

  EventSchema.pre('validate', async function () {
    const deepLink = deepLinkService.generateUserDeepLink({
      modelName: DeepLinkModelsEnum.EVENTS,
      modelId: this._id.toString(),
    });

    const dynamicLink = await firebaseDynamicLinkService.generateFirebaseDynamicLink<Event>(
      this,
      ['description', 'title', 'media'],
      {
        link: deepLink,
        description: this.description,
        title: this.title,
        imageUrl: this.media?.[0]?.url,
      },
    );

    this.dynamicLink = dynamicLink;
  });

  EventSchema.pre('validate', async function () {
    this.isViewable = !this.deletedAt && !this.suspendedDueToUserSuspensionAt && !this.suspendedAt;
  });

  EventSchema.pre('validate', async function () {
    await validateSchema(this, Event);
  });

  EventSchema.pre('save', async function () {
    this.wasNew = this.isNew;
  });

  EventSchema.post('save', async function () {
    if (!this.wasNew) return;

    const userModel = connection.model(ModelNames.USER);

    try {
      await userModel.findOneAndUpdate(
        { _id: this.authorUser },
        {
          $inc: {
            totalEventsHosted: 1,
          },
        },
      );
    } catch (error) {
      new Logger('EventSchema').error('Failed to update user totalEventsHosted: ' + error?.message, { error });
    }
  });

  EventSchema.methods.cancelDoc = async function (this: HydratedDocument<Event>, cancellationReason?: string) {
    this.set({
      cancelledAt: new Date(),
      ...(cancellationReason && { cancellationReason }),
    });
    await this.save();
  };

  EventSchema.methods.deleteDoc = async function (this: HydratedDocument<Event>, _session?: ClientSession) {
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

  EventSchema.methods.suspendDocDueToUserSuspension = async function (this: HydratedDocument<Event>) {
    this.suspendedDueToUserSuspensionAt = new Date();
    await this.save();

    eventEmitter.emit(EventEventListenerTypesEnum.SUSPEND_DOC_DUE_TO_SUSPENSION_AT, this);
  };

  EventSchema.methods.unSuspendDocDueToUserSuspension = async function (this: HydratedDocument<Event>) {
    this.suspendedDueToUserSuspensionAt = null;
    await this.save();

    eventEmitter.emit(EventEventListenerTypesEnum.UN_SUSPEND_DOC_DUE_TO_SUSPENSION_AT, this);
  };

  EventSchema.virtual('status').get(function (this: HydratedDocument<Event>) {
    if (this.cancelledAt) {
      return EventStatusEnum.CANCELLED;
    }

    const now = new Date();

    if (now < this.startDate) {
      return EventStatusEnum.UPCOMING;
    }

    if (now > this.endDate) {
      return EventStatusEnum.PAST;
    }

    return EventStatusEnum.ONGOING;
  });

  async function _deleteDoc(this: HydratedDocument<Event>, session?: ClientSession) {
    this.deletedAt = new Date();
    await this.save({ session });

    const userModel = connection.model(ModelNames.USER);

    try {
      const user = await userModel.findOne({ _id: this.authorUser }).session(session);
      if (user) {
        await userModel
          .findOneAndUpdate(
            { _id: this.authorUser },
            {
              $inc: {
                totalEventsHosted: -1,
              },
            },
          )
          .session(session);
      }
    } catch (error) {
      new Logger('EventSchema').error('Failed to decrement user totalEventsHosted: ' + error?.message, { error });
    }
  }

  const eventModel = connection.model(ModelNames.EVENT, EventSchema);

  return eventModel;
}
