import { Module } from '@nestjs/common';
import { SharedModule } from '@notifications/shared-module/shared.module';
import { NotificationsController } from './controllers/notifications/notifications.controller';
import { NotificationsService } from './controllers/notifications/notifications.service';
import { ServiceProviderNotificationsListenerService } from './controllers/message-handlers/events/listener.service';
import { ServiceProviderNotificationsHandlerService } from './controllers/message-handlers/events/handler.service';

@Module({
  imports: [SharedModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    ServiceProviderNotificationsListenerService,
    ServiceProviderNotificationsHandlerService,
  ],
})
export class ServiceProviderModule {}
