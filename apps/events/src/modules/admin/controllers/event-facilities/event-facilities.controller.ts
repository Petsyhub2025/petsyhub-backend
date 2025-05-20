import { EventFacilityIdParamDto } from '@events/admin/shared/dto/event-facility-id-param.dto';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AdminJwtPersona,
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  BaseSearchPaginationQuery,
  CustomResponse,
  NoApiVersion,
  Persona,
} from '@instapets-backend/common';
import { UpdateEventFacilityDto } from './dto/update-event-facility.dto';
import { CreateEventFacilityDto } from './dto/create-event-facility.dto';
import { EventFacilitiesService } from './event-facilities.service';

@Controller({ path: 'event-facilities', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class EventFacilitiesController {
  constructor(private readonly eventFacilitiesService: EventFacilitiesService) {}

  @Post()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.EVENT_FACILITIES, operation: AdminResourceOperationsEnum.CREATE })
  async createEventFacility(@Persona() adminJWT: AdminJwtPersona, @Body() body: CreateEventFacilityDto) {
    const eventFacility = await this.eventFacilitiesService.createEventFacility(adminJWT._id, body);

    return new CustomResponse().success({
      payload: { data: eventFacility },
    });
  }

  @Patch(':eventFacilityId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.EVENT_FACILITIES, operation: AdminResourceOperationsEnum.UPDATE })
  async updateEventFacility(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() params: EventFacilityIdParamDto,
    @Body() body: UpdateEventFacilityDto,
  ) {
    const eventFacility = await this.eventFacilitiesService.updateEventFacility(adminJWT._id, params, body);

    return new CustomResponse().success({
      payload: { data: eventFacility },
    });
  }

  @Delete(':eventFacilityId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.EVENT_FACILITIES, operation: AdminResourceOperationsEnum.DELETE })
  async deleteEventFacility(@Persona() adminJWT: AdminJwtPersona, @Param() params: EventFacilityIdParamDto) {
    await this.eventFacilitiesService.deleteEventFacility(adminJWT._id, params);
    return new CustomResponse().success({});
  }

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.EVENT_FACILITIES, operation: AdminResourceOperationsEnum.READ })
  async getEventFacilities(@Persona() adminJWT: AdminJwtPersona, @Query() query: BaseSearchPaginationQuery) {
    const eventFacilities = await this.eventFacilitiesService.getEventFacilities(adminJWT._id, query);
    return new CustomResponse().success({
      payload: eventFacilities,
    });
  }

  @Get(':eventFacilityId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.EVENT_FACILITIES, operation: AdminResourceOperationsEnum.READ })
  async getEventFacilityById(@Persona() adminJWT: AdminJwtPersona, @Param() param: EventFacilityIdParamDto) {
    const eventFacility = await this.eventFacilitiesService.getEventFacilityById(adminJWT._id, param);
    return new CustomResponse().success({
      payload: {
        data: eventFacility,
      },
    });
  }
}
