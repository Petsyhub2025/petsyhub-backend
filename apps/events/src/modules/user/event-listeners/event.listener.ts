import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  CustomLoggerService,
  DeepLinkModelsEnum,
  DeepLinkService,
  Event,
  EventEventListenerTypesEnum,
  EventListenerErrorHandlerService,
  EventRsvp,
  IEventModel,
  IEventRsvpModel,
  ModelNames,
  NotificationsHelperService,
  UserNotificationDto,
  UserNotificationTypeEnum,
} from '@instapets-backend/common';
import { ListenerEventNotificationTypeEnum } from '@events/user/shared/enums/listener-event-notification-type.enum';
import { Types } from 'mongoose';
import { catchError, from, lastValueFrom, mergeMap, of } from 'rxjs';

@Injectable()
export class EventEventListener {
  constructor(
    private readonly errorHandler: EventListenerErrorHandlerService,
    private readonly deepLinkService: DeepLinkService,
    private readonly notificationsHelperService: NotificationsHelperService,
    private readonly logger: CustomLoggerService,
    @Inject(ModelNames.EVENT) private eventModel: IEventModel,
    @Inject(ModelNames.EVENT_RSVP) private eventRsvpModel: IEventRsvpModel,
  ) {}

  @OnEvent(EventEventListenerTypesEnum.SEND_NOTIFICATION, { promisify: true })
  async handle(eventId: string | Types.ObjectId, notificationType: ListenerEventNotificationTypeEnum) {
    await this.errorHandler.eventListenerErrorHandler(
      EventEventListenerTypesEnum.SEND_NOTIFICATION,
      this.paginateEventRsvpNotifications.bind(this, eventId, async (docs: Hydrate<EventRsvp>[]) => {
        await this.sendNotification(docs, notificationType);
      }),
    );
  }

  private async sendNotification(
    eventRsvps: Hydrate<EventRsvp>[],
    notificationType: ListenerEventNotificationTypeEnum,
  ) {
    if (!eventRsvps?.length) return;

    await lastValueFrom(
      from(eventRsvps).pipe(
        mergeMap(
          (eventRsvp) =>
            from(this._sendNotification(eventRsvp, notificationType)).pipe(
              catchError((error) => {
                this.logger.error(error?.message || `Failed to send notification to user ${eventRsvp.user}`, { error });
                return of(null);
              }),
            ),
          10,
        ),
      ),
    );
  }

  private async _sendNotification(eventRsvp: Hydrate<EventRsvp>, notificationType: ListenerEventNotificationTypeEnum) {
    if (!this.isEventRsvp(eventRsvp)) {
      throw new Error('Invalid event rsvp');
    }

    const event = await this.eventModel.findById(eventRsvp.event, { _id: 1, title: 1, authorUser: 1 }).lean();

    if (!event) {
      throw new Error('Event not found');
    }

    const receiverId = eventRsvp.user;
    const deepLink = this.deepLinkService.generateUserDeepLink({
      modelId: event._id.toString(),
      modelName: DeepLinkModelsEnum.EVENTS,
    });
    const {
      body,
      title,
      notificationType: userNotificationType,
    } = this.getNotificationTitleAndBodyFromType(event, notificationType);

    if (event.authorUser._id.toString() === receiverId?.toString()) return;

    const notification: UserNotificationDto = {
      title,
      body,
      receiverUserId: receiverId.toString(),
      deepLink,
      dynamicLink: event.dynamicLink,
      notificationType: userNotificationType,
    };

    await this.notificationsHelperService.sendUserNotificationToNotificationService(notification);
  }

  private getNotificationTitleAndBodyFromType(event: Event, notificationType: ListenerEventNotificationTypeEnum) {
    switch (notificationType) {
      case ListenerEventNotificationTypeEnum.UPDATE:
        return {
          title: {
            en: 'Event Updated 📝',
            ar: 'تم تحديث الحدث 📝',
          },
          body: {
            en: `An event you are attending/interested in has been updated: ${event.title}`,
            ar: `تم تحديث الحدث الذي تحضره / تهتم به: ${event.title}`,
          },
          notificationType: UserNotificationTypeEnum.EVENT_UPDATE,
        };
      case ListenerEventNotificationTypeEnum.CANCEL:
        return {
          title: {
            en: 'Event Cancelled ❌',
            ar: 'تم إلغاء الحدث ❌',
          },
          body: {
            en: `An event you are attending/interested in has been cancelled: ${event.title}`,
            ar: `تم إلغاء الحدث الذي تحضره / تهتم به: ${event.title}`,
          },
          notificationType: UserNotificationTypeEnum.EVENT_CANCEL,
        };
      default:
        throw new Error('Invalid notification type');
    }
  }

  private async paginateEventRsvpNotifications(eventId: string, fn: (docs: Hydrate<EventRsvp>[]) => Promise<void>) {
    if (!this.isEventId(eventId)) {
      throw new Error('Invalid event id');
    }

    let page = 1;
    const limit = 100;
    while (true) {
      const docs = (await this.eventRsvpModel.aggregate([
        {
          $match: {
            event: new Types.ObjectId(eventId),
          },
        },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ])) as Hydrate<EventRsvp>[];

      if (!docs.length) {
        break;
      }

      await fn(docs);

      page++;
    }
  }

  private isEventId(eventId: string | Types.ObjectId): eventId is string | Types.ObjectId {
    return typeof eventId === 'string' || eventId instanceof Types.ObjectId;
  }

  private isEventRsvp(eventRsvp: EventRsvp | Hydrate<EventRsvp>): eventRsvp is EventRsvp {
    return !!(eventRsvp.user && eventRsvp.event);
  }
}
