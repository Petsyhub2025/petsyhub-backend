import { globalControllerVersioning } from '@areas/admin/shared/constants';
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomResponse, Persona, UserJwtPersona } from '@instapets-backend/common';
import { CountriesService } from './countries.service';

@Controller({ path: 'countries', ...globalControllerVersioning })
@ApiTags('user')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  @ApiBearerAuth()
  async getCountries(@Persona() userJWT: UserJwtPersona) {
    const countries = await this.countriesService.getCountries(userJWT._id);
    return new CustomResponse().success({
      payload: {
        data: countries,
      },
    });
  }
}
