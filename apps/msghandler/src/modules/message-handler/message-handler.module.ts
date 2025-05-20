import { Module } from '@nestjs/common';
import { UnSuspendsListenerService } from './events/unsuspends/listener.service';
import { UnSuspendsHandlerService } from './events/unsuspends/handler.service';
import {
  AppConfig,
  AwsSchedulerModule,
  ChatMessageMongooseModule,
  CommentMongooseModule,
  CommentReplyMongooseModule,
  DynamicLinkMongooseModule,
  LostFoundMongooseModule,
  PetMongooseModule,
  PostMongooseModule,
  UserFCMTokenMongooseModule,
  UserMongooseModule,
  UserPushNotificationMongooseModule,
  UserSegmentMongooseModule,
} from '@instapets-backend/common';
import { UserPushNotificationsController } from './controllers/user-push-notifications/user-push-notifications.controller';
import { UserPushNotificationsService } from './controllers/user-push-notifications/user-push-notifications.service';
import { MediaModerationController } from './controllers/media-moderation/media-moderation.controller';
import { MediaModerationService } from './controllers/media-moderation/media-moderation.service';

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
    UserMongooseModule,
    PostMongooseModule,
    CommentMongooseModule,
    CommentReplyMongooseModule,
    PetMongooseModule,
    UserSegmentMongooseModule,
    UserPushNotificationMongooseModule,
    UserFCMTokenMongooseModule,
    DynamicLinkMongooseModule,
    ChatMessageMongooseModule,
    LostFoundMongooseModule,
  ],
  controllers: [UserPushNotificationsController, MediaModerationController],
  providers: [
    UnSuspendsListenerService,
    UnSuspendsHandlerService,
    UserPushNotificationsService,
    MediaModerationService,
  ],
})
export class MessageHandlerModule {}
