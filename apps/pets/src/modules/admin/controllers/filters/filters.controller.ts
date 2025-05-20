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
import { GetPetBreedsFilterOptionsQueryDto } from './dto/get-pet-breeds-filter-options.dto';

@Controller({ path: 'filters', version: VERSION_NEUTRAL })
@ApiTags('admin/filters')
export class FiltersController {
  constructor(private readonly filtersService: FiltersService) {}

  @Get('lost-posts')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.LOST_FOUND_POSTS, operation: AdminResourceOperationsEnum.FILTER })
  async getLostPostsFilterOptions(@Persona() adminJWT: AdminJwtPersona, @Query() query: BaseSearchPaginationQuery) {
    const lostPostFilters = await this.filtersService.getLostPostsFilterOptions(adminJWT._id, query);

    return new CustomResponse().success({
      payload: lostPostFilters,
    });
  }

  @Get('found-posts')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.LOST_FOUND_POSTS, operation: AdminResourceOperationsEnum.FILTER })
  async getFoundPostsFilterOptions(@Persona() adminJWT: AdminJwtPersona, @Query() query: BaseSearchPaginationQuery) {
    const foundPostFilters = await this.filtersService.getFoundPostsFilterOptions(adminJWT._id, query);

    return new CustomResponse().success({
      payload: foundPostFilters,
    });
  }

  @Get('pet-types')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.PET_TYPES, operation: AdminResourceOperationsEnum.FILTER })
  async getPetTypesFilterOptions(@Persona() adminJWT: AdminJwtPersona) {
    const result = await this.filtersService.getPetTypesFilterOptions(adminJWT._id);

    return new CustomResponse().success({
      payload: { data: result },
    });
  }

  @Get('pet-breeds')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.PET_BREEDS, operation: AdminResourceOperationsEnum.FILTER })
  async getPetBreedsFilterOptions(
    @Persona() adminJWT: AdminJwtPersona,
    @Query() query: GetPetBreedsFilterOptionsQueryDto,
  ) {
    const result = await this.filtersService.getPetBreedsFilterOptions(adminJWT._id, query);

    return new CustomResponse().success({
      payload: { data: result },
    });
  }

  @Get('pets')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.PETS, operation: AdminResourceOperationsEnum.FILTER })
  async getPetsFilterOptions(@Persona() adminJWT: AdminJwtPersona, @Query() query: BaseSearchPaginationQuery) {
    const result = await this.filtersService.getPetsFilterOptions(adminJWT._id, query);

    return new CustomResponse().success({
      payload: result,
    });
  }
}
