import {
  AppConfig,
  AwsLambdaModule,
  AwsS3Module,
  BranchAccessControlMongooseModule,
  BranchAccessRolesMongooseModule,
  BrandMembershipMongooseModule,
  BrandMongooseModule,
  MediaUploadService,
  ServiceProviderMongooseModule,
  TemplateManagerService,
} from '@instapets-backend/common';
import { Module } from '@nestjs/common';
import { SharedModule } from '@branches/shared/shared.module';
import { BranchesController } from './controllers/branches/branches.controller';
import { BranchesService } from './controllers/branches/branches.service';
import { BranchServiceTypesController } from './controllers/branch-service-types/branch-service-types.controller';
import { BranchServiceTypesService } from './controllers/branch-service-types/branch-service-types.service';
import { MedicalSpecialtyService } from './controllers/medical-specialties/medical-specialty.service';
import { MedicalSpecialtyController } from './controllers/medical-specialties/medical-specialty.controller';
import { BranchAccessRoleService } from './controllers/branch-access-role/branch-access-role.service';
import { BranchAccessRoleController } from './controllers/branch-access-role/branch-access-role.controller';
import { BranchEventListener } from './event-listeners/branch-events.listener';

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
    AwsLambdaModule.registerAsync({
      useFactory: (appConfig: AppConfig) => ({
        accessKeyId: appConfig.AWS_LAMBDA_ACCESS_KEY_ID,
        secretAccessKey: appConfig.AWS_LAMBDA_SECRET_ACCESS_KEY,
        region: appConfig.AWS_LAMBDA_REGION,
      }),
      inject: [AppConfig],
    }),
    BranchAccessControlMongooseModule,
    BrandMembershipMongooseModule,
    BrandMongooseModule,
    ServiceProviderMongooseModule,
  ],
  controllers: [
    BranchesController,
    BranchServiceTypesController,
    MedicalSpecialtyController,
    BranchAccessRoleController,
  ],
  providers: [
    BranchesService,
    BranchServiceTypesService,
    MedicalSpecialtyService,
    BranchAccessRoleService,
    MediaUploadService,
    TemplateManagerService,
    BranchEventListener,
  ],
})
export class ServiceProviderModule {}
