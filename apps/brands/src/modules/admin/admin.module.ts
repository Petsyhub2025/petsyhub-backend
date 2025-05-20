import { Module } from '@nestjs/common';
import { SharedModule } from '@brands/shared/shared.module';
import { AppConfig, AwsLambdaModule, AwsS3Module, MediaUploadService } from '@instapets-backend/common';
import { BrandController } from './controllers/brand.controller';
import { BrandService } from './controllers/brand.service';

@Module({
  imports: [
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
    SharedModule,
  ],
  controllers: [BrandController],
  providers: [BrandService, MediaUploadService],
})
export class AdminModule {}
