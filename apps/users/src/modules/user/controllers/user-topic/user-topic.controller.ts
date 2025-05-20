import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { globalControllerVersioning } from '@users/shared/constants';
import { UserTopicService } from './user-topic.service';
import { CustomResponse, Persona, UserJwtPersona } from '@instapets-backend/common';
import { UpdateUserTopicDto } from './dto/update-user-topic.dto';

@Controller({ path: 'topics', ...globalControllerVersioning })
@ApiTags('user/topics')
export class UserTopicController {
  constructor(private readonly userTopicService: UserTopicService) {}

  @Patch()
  @ApiBearerAuth()
  async updateUserTopics(@Persona() userJWT: UserJwtPersona, @Body() body: UpdateUserTopicDto) {
    await this.userTopicService.updateUserTopics(userJWT._id, body);
    return new CustomResponse().success({});
  }

  @Get()
  @ApiBearerAuth()
  async getUserTopics(@Persona() userJWT: UserJwtPersona) {
    const userTopics = await this.userTopicService.getUserTopics(userJWT._id);
    return new CustomResponse().success({
      payload: {
        data: userTopics,
      },
    });
  }
}
