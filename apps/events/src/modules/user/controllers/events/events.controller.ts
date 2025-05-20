import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { globalControllerVersioning } from '@events/shared/constants';
import { EventsService } from './events.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  BasePaginationQuery,
  CustomResponse,
  GetImageVideoPreSignedUrlQueryDto,
  Persona,
  UserJwtPersona,
} from '@instapets-backend/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventIdParamDto } from '@events/user/shared/dto/event-id-param.dto';
import { GetEventsQueryDto } from './dto/get-events.dto';
import { GetUserRsvpedEventsQueryDto } from './dto/get-rsvped-events.dto';
import { GetEventRsvpResponsesQueryDto } from './dto/get-event-rsvps.dto';
import { CancelEventDto } from './dto/cancel-event.dto';
import { RsvpEventDto } from './dto/rsvp-event.dto';
import { GetUserUpcomingEventsQueryDto } from './dto/get-upcoming-events.dto';

@Controller({ path: 'events', ...globalControllerVersioning })
@ApiTags('user/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @ApiBearerAuth()
  @Get()
  async getEvents(@Persona() userJWT: UserJwtPersona, @Query() query: GetEventsQueryDto) {
    const events = await this.eventsService.getEvents(userJWT._id, query);

    return new CustomResponse().success({
      payload: events,
    });
  }

  @ApiBearerAuth()
  @Get('rsvped')
  async getUserRsvpedEvents(@Persona() userJWT: UserJwtPersona, @Query() query: GetUserRsvpedEventsQueryDto) {
    const events = await this.eventsService.getUserRsvpedEvents(userJWT._id, query);

    return new CustomResponse().success({
      payload: events,
    });
  }

  @ApiBearerAuth()
  @Get('upcoming')
  async getUserUpcomingEvents(@Persona() userJWT: UserJwtPersona, @Query() query: GetUserUpcomingEventsQueryDto) {
    const events = await this.eventsService.getUserUpcomingEvents(userJWT._id, query);

    return new CustomResponse().success({
      payload: events,
    });
  }

  @ApiBearerAuth()
  @Get('created')
  async getUserCreatedEvents(@Persona() userJWT: UserJwtPersona, @Query() query: BasePaginationQuery) {
    const events = await this.eventsService.getUserCreatedEvents(userJWT._id, query);

    return new CustomResponse().success({
      payload: events,
    });
  }

  @ApiBearerAuth()
  @Post()
  async createEvent(@Persona() userJWT: UserJwtPersona, @Body() body: CreateEventDto) {
    const event = await this.eventsService.createEvent(userJWT._id, body);

    return new CustomResponse().success({
      payload: { data: event },
    });
  }

  @ApiBearerAuth()
  @Get(':eventId')
  async getEventById(@Persona() userJWT: UserJwtPersona, @Param() params: EventIdParamDto) {
    const event = await this.eventsService.getEventById(userJWT._id, params);

    return new CustomResponse().success({
      payload: { data: event },
    });
  }

  @ApiBearerAuth()
  @Patch(':eventId')
  async updateEvent(
    @Persona() userJWT: UserJwtPersona,
    @Param() params: EventIdParamDto,
    @Body() body: UpdateEventDto,
  ) {
    const event = await this.eventsService.updateEvent(userJWT._id, params, body);

    return new CustomResponse().success({
      payload: { data: event },
    });
  }

  @ApiBearerAuth()
  @Delete(':eventId')
  async deleteEvent(@Persona() userJWT: UserJwtPersona, @Param() params: EventIdParamDto) {
    await this.eventsService.deleteEvent(userJWT._id, params);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Post(':eventId/cancel')
  async cancelEvent(
    @Persona() userJWT: UserJwtPersona,
    @Param() params: EventIdParamDto,
    @Body() body: CancelEventDto,
  ) {
    await this.eventsService.cancelEvent(userJWT._id, params, body);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Post(':eventId/rsvp')
  async rsvpEvent(@Persona() userJWT: UserJwtPersona, @Param() params: EventIdParamDto, @Body() body: RsvpEventDto) {
    await this.eventsService.rsvpEvent(userJWT._id, params, body);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Get(':eventId/rsvp-responses')
  async getEventRsvpResponses(
    @Persona() userJWT: UserJwtPersona,
    @Param() params: EventIdParamDto,
    @Query() query: GetEventRsvpResponsesQueryDto,
  ) {
    const responses = await this.eventsService.getEventRsvpResponses(userJWT._id, params, query);

    return new CustomResponse().success({
      payload: responses,
    });
  }
}
