import { CityIdParamDto } from '@areas/admin/shared/dto/city-id-param.dto';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AdminJwtPersona,
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  CustomResponse,
  Persona,
} from '@instapets-backend/common';
import { CitiesService } from './cities.service';
import { CreateCityDto } from './dto/create-city.dto';
import { GetCitiesQueryDto } from './dto/get-cities.dto';
import { UpdateCityDto } from './dto/update-city.dto';

@Controller({ path: 'cities', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.CITIES, operation: AdminResourceOperationsEnum.READ })
  async getCities(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetCitiesQueryDto) {
    const cities = await this.citiesService.getCities(adminJWT._id, query);
    return new CustomResponse().success({
      payload: cities,
    });
  }

  @Post()
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.CITIES, operation: AdminResourceOperationsEnum.CREATE })
  async createCity(@Persona() adminJWT: AdminJwtPersona, @Body() body: CreateCityDto) {
    const city = await this.citiesService.createCity(adminJWT._id, body);

    return new CustomResponse().success({
      payload: { data: city },
    });
  }

  @Get(':cityId')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.CITIES, operation: AdminResourceOperationsEnum.READ })
  async getCityById(@Persona() adminJWT: AdminJwtPersona, @Param() param: CityIdParamDto) {
    const city = await this.citiesService.getCityById(adminJWT._id, param);
    return new CustomResponse().success({
      payload: {
        data: city,
      },
    });
  }

  @Patch(':cityId')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.CITIES, operation: AdminResourceOperationsEnum.UPDATE })
  async updateCity(@Persona() adminJWT: AdminJwtPersona, @Param() param: CityIdParamDto, @Body() body: UpdateCityDto) {
    const city = await this.citiesService.updateCity(adminJWT._id, param, body);

    return new CustomResponse().success({
      payload: { data: city },
    });
  }

  @Delete(':cityId')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.CITIES, operation: AdminResourceOperationsEnum.DELETE })
  async deleteCity(@Persona() adminJWT: AdminJwtPersona, @Param() param: CityIdParamDto) {
    await this.citiesService.deleteCity(adminJWT._id, param);

    return new CustomResponse().success({});
  }
}
