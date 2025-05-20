import { Controller, Get, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomResponse, Persona, ServiceProviderJwtPersona } from '@instapets-backend/common';
import { CitiesService } from './cities.service';
import { GetCitiesQueryDto } from './dto/get-cities.dto';

@Controller({ path: 'cities', version: VERSION_NEUTRAL })
@ApiTags('service-provider')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get('clinic')
  @ApiBearerAuth()
  async getCities(@Persona() serviceProviderPersona: ServiceProviderJwtPersona, @Query() query: GetCitiesQueryDto) {
    const cities = await this.citiesService.getCities(serviceProviderPersona._id, query);
    return new CustomResponse().success({
      payload: cities,
    });
  }
}
