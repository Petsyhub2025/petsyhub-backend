import { Module } from '@nestjs/common';
import {
  AppConfig,
  AwsSESModule,
  BrandMembershipMongooseModule,
  BrandMongooseModule,
  ServiceProviderMongooseModule,
} from '@instapets-backend/common';

const imports = [
  BrandMongooseModule,
  BrandMembershipMongooseModule,
  ServiceProviderMongooseModule,

  AwsSESModule.registerAsync({
    useFactory: (appConfig: AppConfig) => ({
      accessKeyId: appConfig.AWS_SES_ACCESS_KEY_ID,
      secretAccessKey: appConfig.AWS_SES_SECRET_ACCESS_KEY,
      region: appConfig.AWS_SES_REGION,
    }),
    inject: [AppConfig],
  }),
];
const providers = [];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
