import { Module } from '@nestjs/common';
import {
  AppConfig,
  AwsLambdaModule,
  MediaUploadService,
  PetFollowMongooseModule,
  PetMongooseModule,
  PostMongooseModule,
  UserFollowMongooseModule,
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
  PetMongooseModule,
  PostMongooseModule,
  UserFollowMongooseModule,
  PetFollowMongooseModule,
];
const providers = [MediaUploadService];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
