import { Module } from '@nestjs/common';
import {
  AppConfig,
  AwsSESModule,
  BranchMongooseModule,
  BranchServiceTypeMongooseModule,
  MedicalSpecialtyMongooseModule,
  BranchAccessRolesMongooseModule,
} from '@instapets-backend/common';

const imports = [
  BranchMongooseModule,
  BranchServiceTypeMongooseModule,
  MedicalSpecialtyMongooseModule,
  BranchAccessRolesMongooseModule,
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
