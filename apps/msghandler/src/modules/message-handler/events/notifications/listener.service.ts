import { Injectable } from '@nestjs/common';
import { NotificationsHandlerService } from './handler.service';

@Injectable()
export class NotificationsListenerService {
  constructor(private readonly notificationsHandlerService: NotificationsHandlerService) {}
}
