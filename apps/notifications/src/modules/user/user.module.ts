import { Module } from '@nestjs/common';
import { SharedModule } from '@notifications/shared-module/shared.module';
import { NotificationsController } from './controllers/notifications/notifications.controller';
import { NotificationsService } from './controllers/notifications/notifications.service';
import { UserNotificationsHandlerService } from './message-handlers/events/handler.service';
import { UserNotificationsListenerService } from './message-handlers/events/listener.service';
import { UserNotificationsReceiverHandlerService } from './message-handlers/rpc/handler.service';
import { UserNotificationsReceiverService } from './message-handlers/rpc/receiver.service';

@Module({
  imports: [SharedModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    UserNotificationsHandlerService,
    UserNotificationsListenerService,
    UserNotificationsReceiverService,
    UserNotificationsReceiverHandlerService,
  ],
})
export class UserModule {}
