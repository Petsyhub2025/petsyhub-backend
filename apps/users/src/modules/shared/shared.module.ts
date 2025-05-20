import { Module } from '@nestjs/common';
import {
  AppConfig,
  AppVersionsMongooseModule,
  AreaMongooseModule,
  AwsLambdaModule,
  AwsSESModule,
  CityMongooseModule,
  CountryMongooseModule,
  MediaUploadService,
  PendingUserFollowMongooseModule,
  UserChatRoomRelationMongooseModule,
  UserFollowMongooseModule,
  UserMongooseModule,
} from '@instapets-backend/common';

const imports = [
  AwsSESModule.registerAsync({
    useFactory: (appConfig: AppConfig) => ({
      accessKeyId: appConfig.AWS_SES_ACCESS_KEY_ID,
      secretAccessKey: appConfig.AWS_SES_SECRET_ACCESS_KEY,
      region: appConfig.AWS_SES_REGION,
    }),
    inject: [AppConfig],
  }),
  AwsLambdaModule.registerAsync({
    useFactory: (appConfig: AppConfig) => ({
      accessKeyId: appConfig.AWS_LAMBDA_ACCESS_KEY_ID,
      secretAccessKey: appConfig.AWS_LAMBDA_SECRET_ACCESS_KEY,
      region: appConfig.AWS_LAMBDA_REGION,
    }),
    inject: [AppConfig],
  }),
  UserMongooseModule,
  CityMongooseModule,
  CountryMongooseModule,
  AreaMongooseModule,
  UserFollowMongooseModule,
  PendingUserFollowMongooseModule,
  AppVersionsMongooseModule,
  UserChatRoomRelationMongooseModule,
];
const providers = [MediaUploadService];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
