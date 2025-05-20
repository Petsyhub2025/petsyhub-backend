import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  AppConfig,
  AwsS3Service,
  BasePaginationQuery,
  Event,
  EventEventListenerTypesEnum,
  EventPlaceLocationSubSchemaType,
  EventRsvp,
  EventRsvpResponseEnum,
  EventStatusEnum,
  GetImageVideoPreSignedUrlQueryDto,
  ICityModel,
  IEventCategoryModel,
  IEventFacilityModel,
  IEventModel,
  IEventRsvpModel,
  IPetBreedModel,
  IPetTypeModel,
  IUserModel,
  MediaTypeEnum,
  MediaUploadService,
  ModelNames,
  Neo4jService,
  NodeTypesEnum,
  RelationTypesEnum,
  ReverseGeocoderService,
  UserBlockHelperService,
  addPaginationStages,
  getIsUserFollowed,
} from '@instapets-backend/common';
import { errorManager } from '@events/user/shared/config/errors.config';
import { PipelineStage, Types } from 'mongoose';
import { from, lastValueFrom, mergeMap } from 'rxjs';
import { AllowedPetTypesDto, CreateEventDto } from './dto/create-event.dto';
import { getEventAggregationPipeline } from './aggregations/get-event-pipeline.aggregation';
import { EventIdParamDto } from '@events/user/shared/dto/event-id-param.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ListenerEventNotificationTypeEnum } from '@events/user/shared/enums/listener-event-notification-type.enum';
import { CancelEventDto } from './dto/cancel-event.dto';
import { GetEventsQueryDto } from './dto/get-events.dto';
import { getEventsAggregationPipeline } from './aggregations/get-events-pipeline.aggregation';
import { GetUserRsvpedEventsQueryDto } from './dto/get-rsvped-events.dto';
import { RsvpEventDto } from './dto/rsvp-event.dto';
import { GetEventRsvpResponsesQueryDto } from './dto/get-event-rsvps.dto';
import { GetUserUpcomingEventsQueryDto } from './dto/get-upcoming-events.dto';
import { UploadModelResources } from '@serverless/common/enums/upload-model-resources.enum';

@Injectable()
export class EventsService {
  constructor(
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.EVENT) private eventModel: IEventModel,
    @Inject(ModelNames.EVENT_RSVP) private eventRsvpModel: IEventRsvpModel,
    @Inject(ModelNames.EVENT_CATEGORY) private eventCategoryModel: IEventCategoryModel,
    @Inject(ModelNames.EVENT_FACILITY) private eventFacilityModel: IEventFacilityModel,
    @Inject(ModelNames.PET_TYPE) private petTypeModel: IPetTypeModel,
    @Inject(ModelNames.PET_BREED) private petBreedModel: IPetBreedModel,
    @Inject(ModelNames.CITY) private cityModel: ICityModel,
    private readonly reverseGeocoderService: ReverseGeocoderService,
    private readonly eventEmitter: EventEmitter2,
    private readonly neo4jService: Neo4jService,
    private readonly userBlockHelperService: UserBlockHelperService,
    private readonly mediaUploadService: MediaUploadService,
  ) {}

  async getEvents(userId: string, query: GetEventsQueryDto) {
    const { page, limit, endDate, startDate, cityId, petTypeIds, type } = query;
    const { page: _, limit: __, ...rest } = query;
    const isCustomQuery = Object.keys(rest).length > 0;

    const user = await this.userModel.findById(userId, { city: 1 }).lean();

    if (!user?.city) {
      throw new BadRequestException(errorManager.INVALID_LOCATION);
    }

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException(errorManager.INVALID_DATE_RANGE);
    }

    if (cityId) {
      const city = await this.cityModel.exists({ _id: cityId });
      if (!city) {
        throw new NotFoundException(errorManager.CITY_NOT_FOUND);
      }
    }

    if (petTypeIds) {
      await this.assertPetTypesAndBreedsExist(petTypeIds.map((petTypeId) => ({ petTypeId })));
    }

    const prePaginationPipeline: PipelineStage[] = [
      {
        $match: {
          isViewable: true,
          cancelledAt: {
            $lte: null,
          },
          ...(type && { type }),
          ...(cityId && { 'placeLocation.locationData.city': cityId }),
          ...(!cityId && { 'placeLocation.locationData.city': user.city }),
          ...(petTypeIds && {
            'allowedPetTypes.petType': {
              $in: petTypeIds,
            },
          }),
          ...(startDate && {
            startDate: {
              $gte: startDate,
            },
          }),
          ...(endDate && {
            endDate: {
              $lte: endDate,
            },
          }),
          ...(!isCustomQuery && {
            'allowedPetTypes.petType': {
              $in: await this.getUserPetTypeInterests(userId),
            },
          }),
        },
      },
    ];

    const [events, [{ total = 0 } = {}]] = await Promise.all([
      this.eventModel.aggregate([
        ...prePaginationPipeline,
        {
          $sort: {
            startDate: 1,
            _id: -1,
          },
        },
        ...addPaginationStages({ page, limit }),
        ...getEventsAggregationPipeline(userId),
      ]),
      this.eventModel.aggregate([...prePaginationPipeline]).count('total'),
    ]);

    const eventsWithStatus = this.hydrateEventsStatuses(events);

    return {
      data: eventsWithStatus,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getEventById(userId: string, { eventId }: EventIdParamDto) {
    const event = await this.populateEventById(userId, eventId);

    if (!event) {
      throw new NotFoundException(errorManager.EVENT_NOT_FOUND);
    }

    const areUsersMutuallyOrPartiallyBlocked = await this.userBlockHelperService.areUsersMutuallyOrPartiallyBlocked(
      userId,
      event.authorUser?._id?.toString(),
    );

    if (areUsersMutuallyOrPartiallyBlocked) {
      throw new BadRequestException(errorManager.EVENT_NOT_FOUND);
    }

    return event;
  }

  async getUserRsvpedEvents(userId: string, { limit, page, response }: GetUserRsvpedEventsQueryDto) {
    const prePaginationPipeline: PipelineStage[] = [
      {
        $match: {
          user: new Types.ObjectId(userId),
          response: response,
        },
      },
    ];

    const postPaginationPipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'events',
          let: { eventId: '$event' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $ifNull: ['$$eventId', null] }],
                },
              },
            },
            ...(getEventsAggregationPipeline(userId) as any),
          ],
          as: 'event',
        },
      },
      {
        $unwind: {
          path: '$event',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$event'],
          },
        },
      },
    ];

    const [events, [{ total = 0 } = {}]] = await Promise.all([
      this.eventRsvpModel.aggregate([
        ...prePaginationPipeline,
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ page, limit }),
        ...postPaginationPipeline,
      ]),
      this.eventRsvpModel.aggregate([...prePaginationPipeline]).count('total'),
    ]);

    const eventsWithStatus = this.hydrateEventsStatuses(events);

    return {
      data: eventsWithStatus,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getUserUpcomingEvents(userId: string, { limit, page }: GetUserUpcomingEventsQueryDto) {
    const prePaginationPipeline: PipelineStage[] = [
      {
        $match: {
          user: new Types.ObjectId(userId),
          response: {
            $in: [EventRsvpResponseEnum.GOING, EventRsvpResponseEnum.INTERESTED],
          },
          startDate: {
            $gte: new Date(),
          },
          cancelledAt: {
            $lte: null,
          },
        },
      },
    ];

    const postPaginationPipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'events',
          let: { eventId: '$event' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $ifNull: ['$$eventId', null] }],
                },
              },
            },
            ...(getEventsAggregationPipeline(userId) as any),
          ],
          as: 'event',
        },
      },
      {
        $unwind: {
          path: '$event',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$event'],
          },
        },
      },
    ];

    const [events, [{ total = 0 } = {}]] = await Promise.all([
      this.eventRsvpModel.aggregate([
        ...prePaginationPipeline,
        {
          $sort: {
            startDate: 1,
            _id: -1,
          },
        },
        ...addPaginationStages({ page, limit }),
        ...postPaginationPipeline,
      ]),
      this.eventRsvpModel.aggregate([...prePaginationPipeline]).count('total'),
    ]);

    const eventsWithStatus = this.hydrateEventsStatuses(events);

    return {
      data: eventsWithStatus,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getUserCreatedEvents(userId: string, { limit, page }: BasePaginationQuery) {
    const prePaginationPipeline: PipelineStage[] = [
      {
        $match: {
          authorUser: new Types.ObjectId(userId),
          isViewable: true,
        },
      },
    ];

    const [events, [{ total = 0 } = {}]] = await Promise.all([
      this.eventModel.aggregate([
        ...prePaginationPipeline,
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ page, limit }),
        ...getEventsAggregationPipeline(userId),
      ]),
      this.eventModel.aggregate([...prePaginationPipeline]).count('total'),
    ]);

    const eventsWithStatus = this.hydrateEventsStatuses(events);

    return {
      data: eventsWithStatus,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getEventRsvpResponses(
    userId: string,
    { eventId }: EventIdParamDto,
    { limit, page, response }: GetEventRsvpResponsesQueryDto,
  ) {
    const event = await this.eventModel.findById(eventId);

    if (!event) {
      throw new NotFoundException(errorManager.EVENT_NOT_FOUND);
    }

    const prePaginationPipeline: PipelineStage[] = [
      {
        $match: {
          event: new Types.ObjectId(eventId),
          response,
        },
      },
    ];

    const postPaginationPipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'users',
          let: { userId: '$user' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $ifNull: ['$$userId', null] }],
                },
              },
            },
            ...getIsUserFollowed(userId),
            {
              $project: {
                _id: 1,
                username: 1,
                profilePictureMedia: 1,
                firstName: 1,
                lastName: 1,
                isFollowed: 1,
                isPendingFollow: 1,
                isFollowingMe: 1,
                isUserPendingFollowOnMe: 1,
              },
            },
          ],
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$user'],
          },
        },
      },
    ];

    const [rsvpResponses, [{ total = 0 } = {}]] = await Promise.all([
      this.eventRsvpModel.aggregate([
        ...prePaginationPipeline,
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ page, limit }),
        ...postPaginationPipeline,
      ]),
      this.eventRsvpModel.aggregate([...prePaginationPipeline]).count('total'),
    ]);

    return {
      data: rsvpResponses,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async createEvent(userId: string, body: CreateEventDto) {
    const {
      allowedPetTypes: _allowedPetTypes,
      categoryId,
      facilityIds,
      placeLocation: { lat, lng, extraAddressDetails },
      mediaUploads,
    } = body;

    await Promise.all([
      this.assertCategoryExists(categoryId),
      this.assertFacilitiesExist(facilityIds),
      this.assertPetTypesAndBreedsExist(_allowedPetTypes),
    ]);

    const googlePlacesLocation = await this.reverseGeocoderService.getGooglePlacesLocation({ lat, lng });

    const placeLocation: EventPlaceLocationSubSchemaType = {
      locationData: googlePlacesLocation,
      extraAddressDetails,
    };
    const allowedPetTypes = _allowedPetTypes.map((allowedPetType) => {
      const { petTypeId, specificPetBreedIds } = allowedPetType;
      return {
        petType: petTypeId,
        specificPetBreeds: specificPetBreedIds,
      };
    });

    const { media, mediaProcessingId } = await this.mediaUploadService.handleMediaUploads({
      files: mediaUploads,
      filesS3PathPrefix: `${userId}/events`,
      resourceModel: {
        name: UploadModelResources.EVENTS,
      },
      allowedMediaTypes: [MediaTypeEnum.IMAGE, MediaTypeEnum.VIDEO],
    });

    const event = await new this.eventModel({
      ...body,
      media,
      mediaProcessingId,
      placeLocation,
      allowedPetTypes,
      authorUser: new Types.ObjectId(userId),
      category: categoryId,
      facilities: facilityIds,
    }).save();

    return this.populateEventById(userId, event._id);
  }

  async updateEvent(userId: string, { eventId }: EventIdParamDto, body: UpdateEventDto) {
    const {
      allowedPetTypes: _allowedPetTypes,
      categoryId,
      facilityIds,
      placeLocation: { lat, lng, extraAddressDetails },
      mediaUploads,
    } = body;

    const oldEvent = await this.eventModel.findById(eventId);

    if (!oldEvent) {
      throw new NotFoundException(errorManager.EVENT_NOT_FOUND);
    }

    if (oldEvent.authorUser.toString() !== userId) {
      throw new BadRequestException(errorManager.EVENT_NOT_FOUND);
    }

    if (oldEvent.status === EventStatusEnum.CANCELLED) {
      throw new BadRequestException(errorManager.CANNOT_UPDATE_CANCELLED_EVENT);
    }

    if (mediaUploads?.length) {
      const { media, mediaProcessingId } = await this.mediaUploadService.handleMediaUploads({
        files: mediaUploads,
        filesS3PathPrefix: `${userId}/events`,
        resourceModel: {
          name: UploadModelResources.EVENTS,
          ...(oldEvent.mediaProcessingId && { mediaProcessingId: oldEvent.mediaProcessingId }),
        },
        allowedMediaTypes: [MediaTypeEnum.IMAGE],
      });

      oldEvent.set({
        media,
        mediaProcessingId,
      });
    }

    oldEvent.set({
      ...body,
    });

    if (categoryId) {
      await this.assertCategoryExists(categoryId);
      oldEvent.set({
        category: categoryId,
      });
    }

    if (facilityIds) {
      await this.assertFacilitiesExist(facilityIds);
      oldEvent.set({
        facilities: facilityIds,
      });
    }

    if (_allowedPetTypes) {
      await this.assertPetTypesAndBreedsExist(_allowedPetTypes);
      const allowedPetTypes = _allowedPetTypes.map((allowedPetType) => {
        const { petTypeId, specificPetBreedIds } = allowedPetType;
        return {
          petType: petTypeId,
          specificPetBreeds: specificPetBreedIds,
        };
      });
      oldEvent.set({
        allowedPetTypes,
      });
    }

    if (body.placeLocation) {
      const googlePlacesLocation = await this.reverseGeocoderService.getGooglePlacesLocation({ lat, lng });
      const placeLocation: EventPlaceLocationSubSchemaType = {
        locationData: googlePlacesLocation,
        extraAddressDetails,
      };
      oldEvent.set({
        placeLocation,
      });
    }

    await oldEvent.save();

    this.eventEmitter.emit(
      EventEventListenerTypesEnum.SEND_NOTIFICATION,
      oldEvent._id.toString(),
      ListenerEventNotificationTypeEnum.UPDATE,
    );

    return this.populateEventById(userId, eventId);
  }

  async cancelEvent(userId: string, { eventId }: EventIdParamDto, { cancellationReason }: CancelEventDto) {
    const event = await this.eventModel.findById(eventId);

    if (!event) {
      throw new NotFoundException(errorManager.EVENT_NOT_FOUND);
    }

    if (event.authorUser.toString() !== userId) {
      throw new BadRequestException(errorManager.EVENT_NOT_FOUND);
    }

    if (event.status === EventStatusEnum.CANCELLED) {
      throw new BadRequestException(errorManager.EVENT_ALREADY_CANCELLED);
    }

    await event.cancelDoc(cancellationReason);

    this.eventEmitter.emit(
      EventEventListenerTypesEnum.SEND_NOTIFICATION,
      event._id.toString(),
      ListenerEventNotificationTypeEnum.CANCEL,
    );
  }

  async deleteEvent(userId: string, { eventId }: EventIdParamDto) {
    const event = await this.eventModel.findById(eventId);

    if (!event) {
      throw new NotFoundException(errorManager.EVENT_NOT_FOUND);
    }

    if (event.authorUser.toString() !== userId) {
      throw new BadRequestException(errorManager.EVENT_NOT_FOUND);
    }

    if (event.status !== EventStatusEnum.CANCELLED) {
      throw new BadRequestException(errorManager.EVENT_NOT_CANCELLED);
    }

    await event.deleteDoc();
  }

  async rsvpEvent(userId: string, { eventId }: EventIdParamDto, { response }: RsvpEventDto) {
    const event = await this.eventModel.findOne({ _id: eventId });

    // TODO: Prevent rsvp if capacity is full using the key disableRsvpAtFullCapacity

    if (!event) {
      throw new NotFoundException(errorManager.EVENT_NOT_FOUND);
    }

    if (event.status === EventStatusEnum.CANCELLED) {
      throw new BadRequestException(errorManager.CANNOT_RSVP_CANCELLED_EVENT);
    }

    const oldEventRsvp = await this.eventRsvpModel.findOne({
      event: eventId,
      user: userId,
    });

    if (oldEventRsvp?.response === response) {
      return;
    }

    const newEventRsvp: Partial<EventRsvp> = {
      user: new Types.ObjectId(userId),
      event: new Types.ObjectId(eventId),
      response,
    };

    const eventRsvp = oldEventRsvp || new this.eventRsvpModel();

    eventRsvp.set(newEventRsvp);

    await eventRsvp.save();
  }

  private async assertCategoryExists(categoryId: string | Types.ObjectId) {
    const category = await this.eventCategoryModel.exists({
      _id: categoryId,
    });
    if (!category) {
      throw new NotFoundException(errorManager.EVENT_CATEGORY_NOT_FOUND);
    }
  }

  private async assertFacilitiesExist(facilityIds: string[] | Types.ObjectId[]) {
    const facilities = await this.eventFacilityModel.find(
      {
        _id: { $in: facilityIds },
      },
      {
        _id: 1,
      },
    );

    if (facilities.length !== facilityIds.length) {
      throw new NotFoundException(errorManager.EVENT_FACILITY_NOT_FOUND);
    }
  }

  private async assertPetTypesAndBreedsExist(allowedPetTypes: AllowedPetTypesDto[]) {
    await lastValueFrom(
      from(allowedPetTypes).pipe(mergeMap((allowedPetType) => this._assertPetTypesAndBreedsExist(allowedPetType))),
    );
  }

  private async _assertPetTypesAndBreedsExist(allowedPetType: AllowedPetTypesDto) {
    const { petTypeId, specificPetBreedIds } = allowedPetType;

    const petTypeExists = await this.petTypeModel.exists({
      _id: petTypeId,
    });

    if (!petTypeExists) {
      throw new NotFoundException(errorManager.PET_TYPE_NOT_FOUND);
    }

    if (specificPetBreedIds) {
      const petBreeds = await this.petBreedModel.find(
        {
          _id: { $in: specificPetBreedIds },
          type: petTypeId,
        },
        {
          _id: 1,
        },
      );

      if (petBreeds.length !== specificPetBreedIds.length) {
        throw new NotFoundException(errorManager.PET_BREED_NOT_FOUND);
      }
    }
  }

  private async getUserPetTypeInterests(userId: string) {
    const userPetTypeInteractionsQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})-[r:${RelationTypesEnum.INTERACTED_WITH}]->(pt:${NodeTypesEnum.PET_TYPE})
      RETURN DISTINCT(pt.typeId) AS petTypeId
    `;

    const userPetTypeInteractions = await this.neo4jService.query(userPetTypeInteractionsQuery, {
      userId,
    });

    return userPetTypeInteractions.map((record) => new Types.ObjectId(record.get('petTypeId')));
  }

  private hydrateEventsStatuses(events: Event[]) {
    return events.map((event) => {
      const hydratedEvent = this.eventModel.hydrate(event);

      return {
        ...event,
        status: hydratedEvent.status,
      };
    });
  }

  private async populateEventById(userId: string, eventId: string | Types.ObjectId) {
    const [event] = await this.eventModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(eventId),
        },
      },
      ...getEventAggregationPipeline(userId),
    ]);

    if (!event) {
      return null;
    }

    const hydratedEvent = this.eventModel.hydrate(event);

    return {
      ...event,
      status: hydratedEvent.status,
    };
  }
}
