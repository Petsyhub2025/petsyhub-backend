import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { ModelNames } from '@common/constants';
import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Types } from 'mongoose';
import { IEventRsvpModel } from '../event-rsvp';
import { EventEventListenerTypesEnum } from '../event.enum';

@Injectable()
export class EventEventListener {
  constructor(
    @Inject(ModelNames.EVENT_RSVP) private eventRsvpModel: IEventRsvpModel,
    private readonly errorHandler: EventListenerErrorHandlerService,
  ) {}

  @OnEvent(EventEventListenerTypesEnum.DELETE_DOC, { promisify: true })
  async propagateDeleteEvent(event: Hydrate<Event>) {
    return this.errorHandler.eventListenerErrorHandler(EventEventListenerTypesEnum.DELETE_DOC, async () => {
      await Promise.all([this.deleteEventRsvps(event._id)]);
    });
  }

  @OnEvent(EventEventListenerTypesEnum.SUSPEND_DOC_DUE_TO_SUSPENSION_AT, { promisify: true })
  async propagateSuspendEventDueToUserSuspend(event: Hydrate<Event>) {
    return this.errorHandler.eventListenerErrorHandler(
      EventEventListenerTypesEnum.SUSPEND_DOC_DUE_TO_SUSPENSION_AT,
      async () => {
        await this.suspendEventRsvpsDueToUserSuspension(event._id);
      },
    );
  }

  @OnEvent(EventEventListenerTypesEnum.UN_SUSPEND_DOC_DUE_TO_SUSPENSION_AT, { promisify: true })
  async propagateUnSuspendEventDueToUserSuspend(event: Hydrate<Event>) {
    return this.errorHandler.eventListenerErrorHandler(
      EventEventListenerTypesEnum.UN_SUSPEND_DOC_DUE_TO_SUSPENSION_AT,
      async () => {
        await this.unSuspendEventRsvpsDueToUserSuspension(event._id);
      },
    );
  }

  private async unSuspendEventRsvpsDueToUserSuspension(eventId: Types.ObjectId) {
    const rsvps = this.eventRsvpModel.find({ user: eventId }).cursor();
    for await (const rsvp of rsvps) {
      await rsvp.unSuspendDocDueToUserSuspension();
    }
  }

  private async suspendEventRsvpsDueToUserSuspension(eventId: Types.ObjectId) {
    const rsvps = this.eventRsvpModel.find({ user: eventId }).cursor();
    for await (const rsvp of rsvps) {
      await rsvp.suspendDocDueToUserSuspension();
    }
  }

  private async deleteEventRsvps(eventId: Types.ObjectId) {
    const rsvps = this.eventRsvpModel.find({ event: eventId }).cursor();
    for await (const rsvp of rsvps) {
      await rsvp.deleteDoc();
    }
  }
}
