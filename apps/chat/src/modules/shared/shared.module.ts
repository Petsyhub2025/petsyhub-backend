import { Module } from '@nestjs/common';
import {
  AppConfig,
  AwsLambdaModule,
  ChatMessageMongooseModule,
  ChatRoomMongooseModule,
  MediaUploadService,
  UserBlockMongooseModule,
  UserChatRoomRelationMongooseModule,
  UserFollowMongooseModule,
  UserMessageStatusMongooseModule,
  UserMongooseModule,
} from '@instapets-backend/common';

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
  ChatRoomMongooseModule,
  UserChatRoomRelationMongooseModule,
  UserFollowMongooseModule,
  ChatMessageMongooseModule,
  UserMessageStatusMongooseModule,
  UserBlockMongooseModule,
];
const providers = [MediaUploadService];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
