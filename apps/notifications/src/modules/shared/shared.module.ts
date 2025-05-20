import { Module } from '@nestjs/common';
import {
  AdminFCMTokenMongooseModule,
  AdminMongooseModule,
  AdminNotificationMongooseModule,
  AppConfig,
  AwsLambdaModule,
  DynamicLinkMongooseModule,
  MediaUploadService,
  ServiceProviderFCMTokenMongooseModule,
  ServiceProviderMongooseModule,
  ServiceProviderNotificationMongooseModule,
  UserFCMTokenMongooseModule,
  UserMongooseModule,
  UserNotificationMongooseModule,
} from '@instapets-backend/common';
import { UserNotificationsService } from './services/user-notifications.service';
import { FCMListener } from './event-listeners/fcm.listener';
import { AdminNotificationsService } from './services/admin-notifications.service';
import { ServiceProviderNotificationsService } from './services/service-provider-notifications.service';

const imports = [
  AwsLambdaModule.registerAsync({
    useFactory: (appConfig: AppConfig) => ({
      accessKeyId: appConfig.AWS_LAMBDA_ACCESS_KEY_ID,
      secretAccessKey: appConfig.AWS_LAMBDA_SECRET_ACCESS_KEY,
      region: appConfig.AWS_LAMBDA_REGION,
    }),
    inject: [AppConfig],
  }),
  UserMongooseModule,
  UserFCMTokenMongooseModule,
  UserNotificationMongooseModule,
  AdminMongooseModule,
  AdminFCMTokenMongooseModule,
  AdminNotificationMongooseModule,
  ServiceProviderMongooseModule,
  ServiceProviderNotificationMongooseModule,
  ServiceProviderFCMTokenMongooseModule,
];
const providers = [
  UserNotificationsService,
  AdminNotificationsService,
  FCMListener,
  ServiceProviderNotificationsService,
  MediaUploadService,
];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
