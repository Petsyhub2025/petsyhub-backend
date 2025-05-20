import { Controller, Get, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomResponse, NoApiVersion, Persona, ServiceProviderJwtPersona } from '@instapets-backend/common';
import { AreasService } from './areas.service';
import { GetAreasQueryDto } from './dto/get-areas.dto';

@Controller({ path: 'areas', version: VERSION_NEUTRAL })
@ApiTags('service-provider')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get('clinic')
  @ApiBearerAuth()
  @NoApiVersion()
  async getAreas(@Persona() serviceProviderPersona: ServiceProviderJwtPersona, @Query() query: GetAreasQueryDto) {
    const areas = await this.areasService.getAreas(serviceProviderPersona._id, query);
    return new CustomResponse().success({
      payload: {
        data: areas,
      },
    });
  }
}
