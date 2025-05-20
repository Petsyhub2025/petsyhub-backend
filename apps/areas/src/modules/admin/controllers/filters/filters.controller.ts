import { Controller, Get, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AdminJwtPersona,
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  CustomResponse,
  Persona,
} from '@instapets-backend/common';
import { GetCitiesFilterOptionsQueryDto } from './dto/get-filter-cities.dto';
import { FiltersService } from './filters.service';
import { GetAreasFilterOptionsQueryDto } from './dto/get-filter-areas.dto';

@Controller({ path: 'filters', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class FiltersController {
  constructor(private readonly filtersService: FiltersService) {}

  @Get('cities')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.CITIES, operation: AdminResourceOperationsEnum.FILTER })
  async getCityFilterOptions(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetCitiesFilterOptionsQueryDto) {
    const cityFilters = await this.filtersService.getCityFilters(adminJWT._id, query);

    return new CustomResponse().success({
      payload: { data: cityFilters },
    });
  }

  @Get('areas')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.AREAS, operation: AdminResourceOperationsEnum.FILTER })
  async getAreaFilterOptions(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetAreasFilterOptionsQueryDto) {
    const areaFilters = await this.filtersService.getAreaFilters(adminJWT._id, query);

    return new CustomResponse().success({
      payload: { data: areaFilters },
    });
  }

  @Get('countries')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.COUNTRIES, operation: AdminResourceOperationsEnum.FILTER })
  async getCountryFilterOptions(@Persona() adminJWT: AdminJwtPersona) {
    const countryFilters = await this.filtersService.getCountryFilters(adminJWT._id);

    return new CustomResponse().success({
      payload: { data: countryFilters },
    });
  }
}
