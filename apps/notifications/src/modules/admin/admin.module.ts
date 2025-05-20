import {
  AppConfig,
  AppointmentMongooseModule,
  AreaMongooseModule,
  AwsSchedulerModule,
  CityMongooseModule,
  CountryMongooseModule,
  DynamicLinkMongooseModule,
  EventMongooseModule,
  LostFoundMongooseModule,
  PetMongooseModule,
  PetTypeMongooseModule,
  PostMongooseModule,
  UserMongooseModule,
  UserPushNotificationMongooseModule,
  UserSegmentMongooseModule,
} from '@instapets-backend/common';
import { Module } from '@nestjs/common';
import { SharedModule } from '@notifications/shared-module/shared.module';
import { DynamicLinksController } from './controllers/dynamic-links/dynamic-links.controller';
import { DynamicLinksService } from './controllers/dynamic-links/dynamic-links.service';
import { FiltersController } from './controllers/filters/filters.controller';
import { FiltersService } from './controllers/filters/filters.service';
import { AdminNotificationsHandlerService } from './controllers/message-handlers/events/handler.service';
import { AdminNotificationsListenerService } from './controllers/message-handlers/events/listener.service';
import { NotificationsController } from './controllers/notifications/notifications.controller';
import { NotificationsService } from './controllers/notifications/notifications.service';
import { UserPushNotificationsController } from './controllers/user-push-notifications/user-push-notifications.controller';
import { UserPushNotificationsService } from './controllers/user-push-notifications/user-push-notifications.service';
import { UserSegmentsController } from './controllers/user-segments/user-segments.controller';
import { UserSegmentsService } from './controllers/user-segments/user-segments.service';

@Module({
  imports: [
    AwsSchedulerModule.registerAsync({
      useFactory: (appConfig: AppConfig) => ({
        accessKeyId: appConfig.AWS_SCHEDULER_ACCESS_KEY_ID,
        secretAccessKey: appConfig.AWS_SCHEDULER_SECRET_ACCESS_KEY,
        region: appConfig.AWS_SCHEDULER_REGION,
      }),
      inject: [AppConfig],
    }),
    SharedModule,
    AppointmentMongooseModule,
    UserMongooseModule,
    PostMongooseModule,
    PetMongooseModule,
    LostFoundMongooseModule,
    EventMongooseModule,
    DynamicLinkMongooseModule,
    UserSegmentMongooseModule,
    UserPushNotificationMongooseModule,
    CountryMongooseModule,
    CityMongooseModule,
    AreaMongooseModule,
    PetTypeMongooseModule,
  ],
  controllers: [
    NotificationsController,
    DynamicLinksController,
    UserSegmentsController,
    UserPushNotificationsController,
    FiltersController,
  ],
  providers: [
    NotificationsService,
    AdminNotificationsListenerService,
    AdminNotificationsHandlerService,
    DynamicLinksService,
    UserSegmentsService,
    UserPushNotificationsService,
    FiltersService,
  ],
})
export class AdminModule {}
