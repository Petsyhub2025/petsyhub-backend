import { Module } from '@nestjs/common';
import { PostsController } from './controllers/posts/posts.controller';
import { PostsService } from './controllers/posts/posts.service';
import { SharedModule } from '@posts/shared-module/shared.module';
import {
  AppConfig,
  AwsS3Module,
  TopicMongooseModule,
  UserBlockMongooseModule,
  UserTopicMongooseModule,
} from '@instapets-backend/common';
import { PostTagsEventListener } from './event-listeners/post-tags.listener';

@Module({
  imports: [
    SharedModule,
    AwsS3Module.registerAsync({
      useFactory: (appConfig: AppConfig) => ({
        accessKeyId: appConfig.AWS_UPLOAD_ACCESS_KEY_ID,
        secretAccessKey: appConfig.AWS_UPLOAD_SECRET_ACCESS_KEY,
        region: appConfig.AWS_UPLOAD_REGION,
      }),
      inject: [AppConfig],
    }),
    UserBlockMongooseModule,
    TopicMongooseModule,
    UserTopicMongooseModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, PostTagsEventListener],
})
export class UserModule {}
