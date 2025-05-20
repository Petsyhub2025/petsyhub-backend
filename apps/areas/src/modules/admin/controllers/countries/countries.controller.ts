import { CountryIdParamDto } from '@areas/admin/shared/dto/country-id-param.dto';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AdminJwtPersona,
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  BaseSearchPaginationQuery,
  CustomResponse,
  Persona,
} from '@instapets-backend/common';
import { CountriesService } from './countries.service';
import { CreateCountryBodyDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

@Controller({ path: 'countries', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Post()
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.COUNTRIES, operation: AdminResourceOperationsEnum.CREATE })
  async createCountry(@Persona() adminJWT: AdminJwtPersona, @Body() body: CreateCountryBodyDto) {
    const country = await this.countriesService.createCountry(adminJWT._id, body);

    return new CustomResponse().success({
      payload: { data: country },
    });
  }

  @Patch(':countryId')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.COUNTRIES, operation: AdminResourceOperationsEnum.UPDATE })
  async updateCountry(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() param: CountryIdParamDto,
    @Body() body: UpdateCountryDto,
  ) {
    const country = await this.countriesService.updateCountry(adminJWT._id, param, body);

    return new CustomResponse().success({
      payload: { data: country },
    });
  }

  @Delete(':countryId')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.COUNTRIES, operation: AdminResourceOperationsEnum.DELETE })
  async deleteCountry(@Persona() adminJWT: AdminJwtPersona, @Param() param: CountryIdParamDto) {
    await this.countriesService.deleteCountry(adminJWT._id, param);
    return new CustomResponse().success({});
  }

  @Get()
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.COUNTRIES, operation: AdminResourceOperationsEnum.READ })
  async getCountries(@Persona() adminJWT: AdminJwtPersona, @Query() query: BaseSearchPaginationQuery) {
    const countries = await this.countriesService.getCountries(adminJWT._id, query);
    return new CustomResponse().success({
      payload: countries,
    });
  }

  @Get(':countryId')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.COUNTRIES, operation: AdminResourceOperationsEnum.READ })
  async getCountryById(@Persona() adminJWT: AdminJwtPersona, @Param() param: CountryIdParamDto) {
    const country = await this.countriesService.getCountryById(adminJWT._id, param);
    return new CustomResponse().success({
      payload: {
        data: country,
      },
    });
  }
}
