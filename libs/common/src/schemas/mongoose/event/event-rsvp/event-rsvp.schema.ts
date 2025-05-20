import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { ClientSession, Connection, HydratedDocument, Schema } from 'mongoose';
import { EventRsvpResponseEnum } from './event-rsvp.enum';
import { EventRsvp, IEventRsvpInstanceMethods, IEventRsvpModel } from './event-rsvp.type';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { Logger } from '@nestjs/common';

const EventRsvpSchema = new Schema<EventRsvp, IEventRsvpModel, IEventRsvpInstanceMethods>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.USER,
      required: true,
    },

    event: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.EVENT,
      required: true,
    },

    response: {
      type: String,
      enum: EventRsvpResponseEnum,
      required: true,
      set: function (this: HydratedDocument<EventRsvp>, response: EventRsvpResponseEnum) {
        this.$response = this.response;
        return response;
      },
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function eventRsvpSchemaFactory(connection: Connection) {
  EventRsvpSchema.index({ user: 1 });
  EventRsvpSchema.index({ event: 1 });
  EventRsvpSchema.index({ user: 1, event: 1 });
  EventRsvpSchema.index({ event: 1, response: 1 });

  EventRsvpSchema.pre('validate', async function () {
    this.isViewable = !this.deletedAt;
  });

  EventRsvpSchema.pre('validate', async function () {
    await validateSchema(this, EventRsvp);
  });

  EventRsvpSchema.post('save', async function () {
    // TODO: Could improve and inc/dec based on response if this count gets used in any user facing domains
    // Make sure to do it in relativity to the doc being new or not
    if (this.response !== EventRsvpResponseEnum.GOING) return;

    const userModel = connection.model(ModelNames.USER);

    try {
      await userModel.findOneAndUpdate(
        { _id: this.user },
        {
          $inc: {
            totalEventsAttended: 1,
          },
        },
      );
    } catch (error) {
      new Logger('EventRsvpSchema').error('Failed to update user totalEventsAttended: ' + error?.message, { error });
    }
  });

  EventRsvpSchema.post('save', async function () {
    if (this.response === EventRsvpResponseEnum.NOT_INTERESTED) return;

    const eventModel = connection.model(ModelNames.EVENT);

    const fieldToUpdate = this.response === EventRsvpResponseEnum.GOING ? 'totalGoing' : 'totalInterested';

    try {
      await eventModel.findOneAndUpdate(
        { _id: this.event },
        {
          $inc: {
            [fieldToUpdate]: 1,
          },
        },
      );
    } catch (error) {
      new Logger('EventRsvpSchema').error('Failed to update event counts: ' + error?.message, { error });
    }
  });

  EventRsvpSchema.post('save', async function () {
    const eventModel = connection.model(ModelNames.EVENT);
    const previousResponse = this.$response;

    if (
      previousResponse == undefined ||
      previousResponse === this.response ||
      previousResponse === EventRsvpResponseEnum.NOT_INTERESTED
    )
      return;

    const fieldToUpdate = previousResponse === EventRsvpResponseEnum.GOING ? 'totalGoing' : 'totalInterested';

    try {
      await eventModel.findOneAndUpdate(
        { _id: this.event },
        {
          $inc: {
            [fieldToUpdate]: -1,
          },
        },
      );
    } catch (error) {
      new Logger('EventRsvpSchema').error('Failed to update event counts on NOT_INTERESTED: ' + error?.message, {
        error,
      });
    }
  });

  EventRsvpSchema.methods.deleteDoc = async function (this: HydratedDocument<EventRsvp>, _session?: ClientSession) {
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

  async function _deleteDoc(this: HydratedDocument<EventRsvp>, session?: ClientSession) {
    this.deletedAt = new Date();
    await this.save({ session });
  }

  const eventRsvpModel = connection.model(ModelNames.EVENT_RSVP, EventRsvpSchema);

  return eventRsvpModel;
}
