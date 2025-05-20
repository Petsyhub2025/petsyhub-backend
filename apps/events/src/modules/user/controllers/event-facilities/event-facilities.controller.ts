import { Controller, Get } from '@nestjs/common';
import { globalControllerVersioning } from '@events/shared/constants';
import { EventFacilitiesService } from './event-facilities.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomResponse, Persona, UserJwtPersona } from '@instapets-backend/common';

@Controller({ path: 'event-facilities', ...globalControllerVersioning })
@ApiTags('user/event-facilities')
export class EventFacilitiesController {
  constructor(private readonly eventFacilitiesService: EventFacilitiesService) {}

  @Get()
  @ApiBearerAuth()
  async getEventFacilities(@Persona() userJWT: UserJwtPersona) {
    const eventFacilities = await this.eventFacilitiesService.getEventFacilities(userJWT._id);
    return new CustomResponse().success({
      payload: {
        data: eventFacilities,
      },
    });
  }
}
