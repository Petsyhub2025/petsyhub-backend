import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { ClientSession, Connection, Schema } from 'mongoose';
import { IUserSegmentInstanceMethods, IUserSegmentModel, UserSegment } from './user-segment.type';
import { UserSegmentLocationSubSchema } from './user-segment-subschemas/user-location';
import { MinMaxRangeSchema } from '@common/schemas/mongoose/common/min-max-range';
import { UserSegmentDeviceSubSchema } from './user-segment-subschemas/user-device';
import { PetStatusEnum } from '@common/schemas/mongoose/pet/pet.enum';

const UserSegmentSchema = new Schema<UserSegment, IUserSegmentModel, IUserSegmentInstanceMethods>(
  {
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },

    description: {
      type: String,
      required: false,
      maxlength: 500,
    },

    petTypes: {
      type: [Schema.Types.ObjectId],
      ref: ModelNames.PET_TYPE,
      required: false,
      default: [],
    },

    petStatuses: {
      type: [String],
      enum: PetStatusEnum,
      required: false,
      default: [],
    },

    locations: {
      type: [UserSegmentLocationSubSchema],
      required: false,
      default: [],
    },

    devices: {
      type: UserSegmentDeviceSubSchema,
      required: false,
    },

    hasAttendedEvents: {
      type: Boolean,
      required: false,
    },

    hasHostedEvents: {
      type: Boolean,
      required: false,
    },

    totalPets: {
      type: MinMaxRangeSchema,
      required: false,
    },

    totalFollowers: {
      type: MinMaxRangeSchema,
      required: false,
    },

    age: {
      type: MinMaxRangeSchema,
      required: false,
    },

    isArchived: {
      type: Boolean,
      required: false,
      default: false,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function userSegmentSchemaFactory(connection: Connection) {
  UserSegmentSchema.pre('validate', async function () {
    // Make sure there is atleast one criteria field present
    const segmentFields = [
      'petTypes',
      'petStatuses',
      'locations',
      'devices',
      'hasAttendedEvents',
      'hasHostedEvents',
      'totalPets',
      'totalFollowers',
      'age',
    ];
    const docFields = Object.keys(this.toObject());
    const hasAtleastOneField = segmentFields.some(
      (key) =>
        docFields.includes(key) &&
        ((this[key] != undefined && !Array.isArray(this[key])) || (Array.isArray(this[key]) && this[key].length > 0)),
    );

    if (!hasAtleastOneField) {
      throw new Error('User segment must have atleast one criteria defining field');
    }
  });

  UserSegmentSchema.pre('validate', async function () {
    await validateSchema(this, UserSegment);
  });

  UserSegmentSchema.methods.deleteDoc = async function (this: Hydrate<UserSegment>, _session?: ClientSession) {
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

  async function _deleteDoc(this: Hydrate<UserSegment>, session?: ClientSession) {
    this.deletedAt = new Date();
    await this.save({ session });
  }

  const userSegmentModel = connection.model(ModelNames.USER_SEGMENT, UserSegmentSchema);

  return userSegmentModel;
}
