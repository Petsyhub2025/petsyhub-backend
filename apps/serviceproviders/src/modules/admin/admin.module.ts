import { Module } from '@nestjs/common';
import { SharedModule } from '@serviceproviders/shared/shared.module';
import { ServiceProvidersController } from './controllers/service-providers/service-providers.controller';
import { ServiceProvidersService } from './controllers/service-providers/service-providers.service';
import { AppConfig, AwsS3Module } from '@instapets-backend/common';

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
  ],
  controllers: [ServiceProvidersController],
  providers: [ServiceProvidersService],
})
export class AdminModule {}
