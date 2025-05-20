import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LostPostEventListener {
  constructor(private readonly errorHandler: EventListenerErrorHandlerService) {}
}
