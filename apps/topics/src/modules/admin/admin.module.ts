import { Module } from '@nestjs/common';
import { TopicsService } from './controllers/topics/topics.service';
import { TopicsController } from './controllers/topics/topics.controller';
import { SharedModule } from '@topics/shared/shared.module';
import { AppConfig, AwsLambdaModule, MediaUploadService } from '@instapets-backend/common';

@Module({
  imports: [
    SharedModule,
    AwsLambdaModule.registerAsync({
      useFactory: (appConfig: AppConfig) => ({
        accessKeyId: appConfig.AWS_LAMBDA_ACCESS_KEY_ID,
        secretAccessKey: appConfig.AWS_LAMBDA_SECRET_ACCESS_KEY,
        region: appConfig.AWS_LAMBDA_REGION,
      }),
      inject: [AppConfig],
    }),
  ],
  controllers: [TopicsController],
  providers: [TopicsService, MediaUploadService],
})
export class AdminModule {}
