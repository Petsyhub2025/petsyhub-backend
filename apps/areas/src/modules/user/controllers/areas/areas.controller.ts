import { globalControllerVersioning } from '@areas/admin/shared/constants';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomResponse, Persona, UserJwtPersona } from '@instapets-backend/common';
import { AreasService } from './areas.service';
import { GetAreasQueryDto } from './dto/get-areas.dto';
import { GetNearestAreasQueryDto } from './dto/get-nearest-areas.dto';

@Controller({ path: 'areas', ...globalControllerVersioning })
@ApiTags('user')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get()
  @ApiBearerAuth()
  async getAreas(@Persona() userJWT: UserJwtPersona, @Query() query: GetAreasQueryDto) {
    const areas = await this.areasService.getAreas(userJWT._id, query);
    return new CustomResponse().success({
      payload: {
        data: areas,
      },
    });
  }

  @Get('/nearest')
  @ApiBearerAuth()
  async getNearestAreas(@Persona() userJWT: UserJwtPersona, @Query() query: GetNearestAreasQueryDto) {
    const areas = await this.areasService.getNearestAreas(userJWT._id, query);

    return new CustomResponse().success({
      payload: {
        data: areas,
      },
    });
  }
}
