import { globalControllerVersioning } from '@areas/admin/shared/constants';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomResponse, Persona, UserJwtPersona } from '@instapets-backend/common';
import { CitiesService } from './cities.service';
import { GetCitiesQueryDto } from './dto/get-cities.dto';

@Controller({ path: 'cities', ...globalControllerVersioning })
@ApiTags('user')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  @ApiBearerAuth()
  async getCities(@Persona() userJWT: UserJwtPersona, @Query() query: GetCitiesQueryDto) {
    const cities = await this.citiesService.getCities(userJWT._id, query);
    return new CustomResponse().success({
      payload: {
        data: cities,
      },
    });
  }
}
