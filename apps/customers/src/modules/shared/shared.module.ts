import { Module } from '@nestjs/common';
import {
  AppConfig,
  AppVersionsMongooseModule,
  AreaMongooseModule,
  AwsSESModule,
  CityMongooseModule,
  CountryMongooseModule,
  CustomerMongooseModule,
  ShippingConfigMongooseModule,
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
  CustomerMongooseModule,
  UserMongooseModule,
  CityMongooseModule,
  CountryMongooseModule,
  AreaMongooseModule,
  AppVersionsMongooseModule,
  ShippingConfigMongooseModule,
];
const providers = [];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
