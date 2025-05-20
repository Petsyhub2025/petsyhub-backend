import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomResponse, Persona, ServiceProviderJwtPersona } from '@instapets-backend/common';
import { CountriesService } from './countries.service';
import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({ path: 'countries', version: VERSION_NEUTRAL })
@ApiTags('service-provider')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get('clinic')
  @ApiBearerAuth()
  async getCountries(@Persona() serviceProviderPersona: ServiceProviderJwtPersona) {
    const countries = await this.countriesService.getCountries(serviceProviderPersona._id);
    return new CustomResponse().success({
      payload: countries,
    });
  }
}
