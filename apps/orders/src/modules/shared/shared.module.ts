import { Module } from '@nestjs/common';
import {
  AppConfig,
  AwsSESModule,
  CustomerMongooseModule,
  OrderMongooseModule,
  ShippingConfigMongooseModule,
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
  OrderMongooseModule,
  ShippingConfigMongooseModule,
];
const providers = [];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
