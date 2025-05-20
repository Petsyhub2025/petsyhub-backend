import { globalControllerVersioning } from '@chat/shared-module/constants';
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';

@Controller({
  path: 'chat',
  ...globalControllerVersioning,
})
@ApiTags('user')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
}
