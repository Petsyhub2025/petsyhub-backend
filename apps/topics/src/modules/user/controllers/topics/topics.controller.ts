import { globalControllerVersioning } from '@areas/admin/shared/constants';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomResponse, Persona, UserJwtPersona } from '@instapets-backend/common';
import { TopicsService } from './topics.service';

@Controller({ path: 'topics', ...globalControllerVersioning })
@ApiTags('user')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  @ApiBearerAuth()
  async getTopics(@Persona() userJWT: UserJwtPersona) {
    const topics = await this.topicsService.getTopics(userJWT._id);
    return new CustomResponse().success({
      payload: {
        data: topics,
      },
    });
  }
}
