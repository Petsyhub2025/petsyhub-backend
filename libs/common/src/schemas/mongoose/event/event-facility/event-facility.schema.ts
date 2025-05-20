import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { ClientSession, Connection, HydratedDocument, Schema } from 'mongoose';
import { EventFacility, IEventFacilityInstanceMethods, IEventFacilityModel } from './event-facility.type';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { LocalizedTextSchema } from '@common/schemas/mongoose/common/localized-text';

const EventFacilitySchema = new Schema<EventFacility, IEventFacilityModel, IEventFacilityInstanceMethods>(
  {
    name: {
      type: LocalizedTextSchema(),
      required: true,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function eventFacilitySchemaFactory(connection: Connection) {
  EventFacilitySchema.index({ 'name.en': 1 }, { unique: true });
  EventFacilitySchema.index({ 'name.ar': 1 }, { unique: true });
  EventFacilitySchema.index({ _id: 1, name: 1 });

  EventFacilitySchema.pre('validate', async function () {
    this.isViewable = !this.deletedAt;
  });

  EventFacilitySchema.pre('validate', async function () {
    await validateSchema(this, EventFacility);
  });

  EventFacilitySchema.methods.deleteDoc = async function (
    this: HydratedDocument<EventFacility>,
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

  async function _deleteDoc(this: HydratedDocument<EventFacility>, session?: ClientSession) {
    this.deletedAt = new Date();
    await this.save({ session });
  }

  const eventFacilityModel = connection.model(ModelNames.EVENT_FACILITY, EventFacilitySchema);

  return eventFacilityModel;
}
