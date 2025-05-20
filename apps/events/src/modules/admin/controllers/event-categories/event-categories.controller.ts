import { Body, Controller, Delete, Get, Param, Patch, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EventCategoriesService } from './event-categories.service';
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
import { CreateEventCategoryDto } from './dto/create-event-category.dto';
import { EventCategoryIdParamDto } from '@events/admin/shared/dto/event-category-id-param.dto';
import { UpdateEventCategoryDto } from './dto/update-event-category.dto';

@Controller({ path: 'event-categories', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class EventCategoriesController {
  constructor(private readonly eventCategoriesService: EventCategoriesService) {}

  @Post()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.EVENT_CATEGORIES, operation: AdminResourceOperationsEnum.CREATE })
  async createEventCategory(@Persona() adminJWT: AdminJwtPersona, @Body() body: CreateEventCategoryDto) {
    const eventCategory = await this.eventCategoriesService.createEventCategory(adminJWT._id, body);

    return new CustomResponse().success({
      payload: { data: eventCategory },
    });
  }

  @Patch(':eventCategoryId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.EVENT_CATEGORIES, operation: AdminResourceOperationsEnum.UPDATE })
  async updateEventCategory(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() params: EventCategoryIdParamDto,
    @Body() body: UpdateEventCategoryDto,
  ) {
    const eventCategory = await this.eventCategoriesService.updateEventCategory(adminJWT._id, params, body);

    return new CustomResponse().success({
      payload: { data: eventCategory },
    });
  }

  @Delete(':eventCategoryId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.EVENT_CATEGORIES, operation: AdminResourceOperationsEnum.DELETE })
  async deleteEventCategory(@Persona() adminJWT: AdminJwtPersona, @Param() params: EventCategoryIdParamDto) {
    await this.eventCategoriesService.deleteEventCategory(adminJWT._id, params);
    return new CustomResponse().success({});
  }

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.EVENT_CATEGORIES, operation: AdminResourceOperationsEnum.READ })
  async getEventCategories(@Persona() adminJWT: AdminJwtPersona, @Query() query: BaseSearchPaginationQuery) {
    const eventCategories = await this.eventCategoriesService.getEventCategories(adminJWT._id, query);
    return new CustomResponse().success({
      payload: eventCategories,
    });
  }

  @Get(':eventCategoryId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.EVENT_CATEGORIES, operation: AdminResourceOperationsEnum.READ })
  async getEventCategoryById(@Persona() adminJWT: AdminJwtPersona, @Param() param: EventCategoryIdParamDto) {
    const eventCategory = await this.eventCategoriesService.getEventCategoryById(adminJWT._id, param);
    return new CustomResponse().success({
      payload: {
        data: eventCategory,
      },
    });
  }
}
