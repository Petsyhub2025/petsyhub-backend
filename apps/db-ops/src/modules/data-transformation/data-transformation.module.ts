import { SharedModule } from '@db-ops/modules/shared/shared.module';
import {
  AppConfig,
  AwsLambdaModule,
  AwsS3Module,
  EnvironmentEnum,
  FCMModule,
  MediaUploadService,
} from '@instapets-backend/common';
import { Module } from '@nestjs/common';
import { DataTransformationService } from './services/data-transformation.service';

@Module({
  imports: [
    SharedModule,
    FCMModule.registerAsync({
      useFactory: () => ({
        firebaseEnv: EnvironmentEnum.DEV,
      }),
      inject: [],
    }),
    AwsS3Module.registerAsync({
      useFactory: (appConfig: AppConfig) => ({
        accessKeyId: appConfig.AWS_UPLOAD_ACCESS_KEY_ID,
        secretAccessKey: appConfig.AWS_UPLOAD_SECRET_ACCESS_KEY,
        region: appConfig.AWS_UPLOAD_REGION,
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
  ],
  controllers: [],
  providers: [DataTransformationService, MediaUploadService],
})
export class DataTransformationModule {}
