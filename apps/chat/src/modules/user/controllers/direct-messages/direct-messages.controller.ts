import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DirectMessagesService } from './direct-messages.service';
import { CustomResponse, Persona, UserJwtPersona } from '@instapets-backend/common';
import { InitDirectMessageDto } from './dto/init-direct-message.dto';
import { globalControllerVersioning } from '@chat/shared-module/constants';

@Controller({
  path: 'direct-messages',
  ...globalControllerVersioning,
})
@ApiTags('user')
export class DirectMessagesController {
  constructor(private readonly directMessagesService: DirectMessagesService) {}

  @ApiBearerAuth()
  @Post()
  async initDirectMessage(@Persona() userJWT: UserJwtPersona, @Body() body: InitDirectMessageDto) {
    const directMessageRoom = await this.directMessagesService.initDirectMessage(userJWT._id, body);

    return new CustomResponse().success({
      payload: { data: directMessageRoom },
    });
  }
}
