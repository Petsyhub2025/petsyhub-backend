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

  @Get('users')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.USERS, operation: AdminResourceOperationsEnum.FILTER })
  async getUsersFilterOptions(@Persona() adminJWT: AdminJwtPersona, @Query() query: BaseSearchPaginationQuery) {
    const result = await this.filtersService.getUsersFilterOptions(adminJWT._id, query);

    return new CustomResponse().success({
      payload: result,
    });
  }
}
