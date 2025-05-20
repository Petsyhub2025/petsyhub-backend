import { Controller, Get } from '@nestjs/common';
import { globalControllerVersioning } from '@events/shared/constants';
import { EventCategoriesService } from './event-categories.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomResponse, Persona, UserJwtPersona } from '@instapets-backend/common';

@Controller({ path: 'event-categories', ...globalControllerVersioning })
@ApiTags('user/event-categories')
export class EventCategoriesController {
  constructor(private readonly eventCategoriesService: EventCategoriesService) {}

  @Get()
  @ApiBearerAuth()
  async getEventCategories(@Persona() userJWT: UserJwtPersona) {
    const eventCategories = await this.eventCategoriesService.getEventCategories(userJWT._id);
    return new CustomResponse().success({
      payload: {
        data: eventCategories,
      },
    });
  }
}
