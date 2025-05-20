import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { ClientSession, Connection, HydratedDocument, Schema } from 'mongoose';
import {
  IUserPushNotificationInstanceMethods,
  IUserPushNotificationModel,
  UserPushNotification,
} from './user-push-notification.type';
import { MediaSchema } from '@common/schemas/mongoose/common/media';
import { UserPushNotificationStatusEnum } from './user-push-notification.enum';
import { LocalizedTextSchema } from '@common/schemas/mongoose/common/localized-text';

const UserPushNotificationSchema = new Schema<
  UserPushNotification,
  IUserPushNotificationModel,
  IUserPushNotificationInstanceMethods
>(
  {
    name: {
      type: String,
      required: true,
    },

    title: {
      type: LocalizedTextSchema({ maxlength: 100 }),
      required: true,
    },

    body: {
      type: LocalizedTextSchema({ maxlength: 500 }),
      required: true,
    },

    media: {
      type: MediaSchema,
      required: true,
    },

    mediaProcessingId: {
      type: String,
      required: false,
    },

    dynamicLinkId: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.DYNAMIC_LINK,
      required: true,
    },

    userSegments: {
      type: [Schema.Types.ObjectId],
      ref: ModelNames.USER_SEGMENT,
      required: true,
    },

    includeAllUsers: {
      type: Boolean,
      required: true,
    },

    status: {
      type: String,
      enum: UserPushNotificationStatusEnum,
      required: false,
      default: UserPushNotificationStatusEnum.SCHEDULED,
    },

    scheduledDate: {
      type: Date,
      required: true,
    },

    cancelledAt: {
      type: Date,
      required: false,
    },

    cancellationReason: {
      type: String,
      required: function (this: Hydrate<UserPushNotification>) {
        return this.cancelledAt != undefined;
      },
    },

    usersCount: {
      type: Number,
      required: false,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);
export function userPushNotificationSchemaFactory(connection: Connection) {
  UserPushNotificationSchema.index({ mediaProcessingId: 1 });

  UserPushNotificationSchema.pre('validate', async function () {
    await validateSchema(this, UserPushNotification);
  });

  UserPushNotificationSchema.methods.deleteDoc = async function (
    this: Hydrate<UserPushNotification>,
    _session?: ClientSession,
  ) {
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

  UserPushNotificationSchema.methods.cancelDoc = async function (
    this: HydratedDocument<UserPushNotification>,
    cancellationReason: string,
    session: ClientSession,
  ) {
    this.set({
      status: UserPushNotificationStatusEnum.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason,
    });
    await this.save({ session });
  };

  async function _deleteDoc(this: Hydrate<UserPushNotification>, session?: ClientSession) {
    this.deletedAt = new Date();
    await this.save({ session });
  }

  const userPushNotificationModel = connection.model(ModelNames.USER_PUSH_NOTIFICATION, UserPushNotificationSchema);

  return userPushNotificationModel;
}
