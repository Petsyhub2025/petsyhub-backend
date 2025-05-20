import { Controller, Get, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FiltersService } from './filters.service';
import {
  AdminJwtPersona,
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  BaseSearchPaginationQuery,
  CustomResponse,
  Persona,
} from '@instapets-backend/common';

@Controller({ path: 'filters', version: VERSION_NEUTRAL })
@ApiTags('admin/filters')
export class FiltersController {
  constructor(private readonly filtersService: FiltersService) {}

  @Get('user-segments')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.FILTER })
  async getUserSegmentFilterOptions(@Persona() adminJWT: AdminJwtPersona, @Query() query: BaseSearchPaginationQuery) {
    const userSegmentFilters = await this.filtersService.getUserSegmentFilterOptions(adminJWT._id, query);

    return new CustomResponse().success({
      payload: { data: userSegmentFilters },
    });
  }

  @Get('dynamic-links')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.MARKETING, operation: AdminResourceOperationsEnum.FILTER })
  async getDynamicLinksFilterOptions(@Persona() adminJWT: AdminJwtPersona, @Query() query: BaseSearchPaginationQuery) {
    const dynamicLinksFilters = await this.filtersService.getDynamicLinksFilterOptions(adminJWT._id, query);

    return new CustomResponse().success({
      payload: { data: dynamicLinksFilters },
    });
  }
}
