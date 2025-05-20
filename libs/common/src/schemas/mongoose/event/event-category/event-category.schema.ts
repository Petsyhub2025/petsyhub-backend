import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { ClientSession, Connection, HydratedDocument, Schema } from 'mongoose';
import { EventCategory, IEventCategoryInstanceMethods, IEventCategoryModel } from './event-category.type';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { LocalizedTextSchema } from '@common/schemas/mongoose/common/localized-text';

const EventCategorySchema = new Schema<EventCategory, IEventCategoryModel, IEventCategoryInstanceMethods>(
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

export function eventCategorySchemaFactory(connection: Connection) {
  EventCategorySchema.index({ 'name.en': 1 }, { unique: true });
  EventCategorySchema.index({ 'name.ar': 1 }, { unique: true });
  EventCategorySchema.index({ _id: 1, name: 1 });

  EventCategorySchema.pre('validate', async function () {
    this.isViewable = !this.deletedAt;
  });

  EventCategorySchema.pre('validate', async function () {
    await validateSchema(this, EventCategory);
  });

  EventCategorySchema.methods.deleteDoc = async function (
    this: HydratedDocument<EventCategory>,
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

  async function _deleteDoc(this: HydratedDocument<EventCategory>, session?: ClientSession) {
    this.deletedAt = new Date();
    await this.save({ session });
  }

  const eventCategoryModel = connection.model(ModelNames.EVENT_CATEGORY, EventCategorySchema);

  return eventCategoryModel;
}
