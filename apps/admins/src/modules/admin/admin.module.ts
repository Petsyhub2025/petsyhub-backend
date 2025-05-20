import { Module } from '@nestjs/common';
import { SharedModule } from '@admins/shared-module/shared.module';
import { AdminAuthController } from './controllers/admin-auth/admin-auth.controller';
import { AdminAuthService } from './controllers/admin-auth/admin-auth.service';
import { RefreshTokenStrategyService } from './controllers/admin-auth/strategies/refresh-token/refresh-token-strategy.service';
import { RefreshTokenStrategy } from './controllers/admin-auth/strategies/refresh-token/refresh-token.strategy';
import { RefreshTokenGuard } from './controllers/admin-auth/guards/refresh-token.guard';
import { PassportModule } from '@nestjs/passport';
import {
  AdminFCMTokenMongooseModule,
  AdminMongooseModule,
  AdminRolesMongooseModule,
  AppConfig,
  AppVersionsMongooseModule,
  AwsCognitoModule,
  AwsS3Module,
} from '@instapets-backend/common';
import { AdminController } from './controllers/admin/admin.controller';
import { AdminService } from './controllers/admin/admin.service';
import { AdminRolesService } from './controllers/admin-roles/admin-roles-roles.service';
import { AdminRolesController } from './controllers/admin-roles/admin-roles.controller';
import { AppVersionsController } from './controllers/app-versions/app-versions.controller';
import { AppVersionsService } from './controllers/app-versions/app-versions.service';

@Module({
  imports: [
    AwsCognitoModule.registerAsync({
      useFactory: (appConfig: AppConfig) => ({
        accessKeyId: appConfig.AWS_COGNITO_ACCESS_KEY_ID,
        secretAccessKey: appConfig.AWS_COGNITO_SECRET_ACCESS_KEY,
        region: appConfig.AWS_COGNITO_REGION,
        identityPoolId: appConfig.AWS_COGNITO_IDENTITY_POOL_ID,
        developerIdentityId: appConfig.AWS_COGNITO_DEVELOPER_IDENTITY_ID,
      }),
      inject: [AppConfig],
    }),
    AwsS3Module.registerAsync({
      useFactory: (appConfig: AppConfig) => ({
        accessKeyId: appConfig.AWS_UPLOAD_ACCESS_KEY_ID,
        secretAccessKey: appConfig.AWS_UPLOAD_SECRET_ACCESS_KEY,
        region: appConfig.AWS_UPLOAD_REGION,
      }),
      inject: [AppConfig],
    }),
    SharedModule,
    AdminMongooseModule,
    AdminRolesMongooseModule,
    AdminFCMTokenMongooseModule,
    AppVersionsMongooseModule,
    PassportModule.register({ session: false, property: 'persona' }),
  ],
  controllers: [AdminAuthController, AdminController, AdminRolesController, AppVersionsController],
  providers: [
    RefreshTokenStrategyService,
    RefreshTokenStrategy,
    RefreshTokenGuard,
    AdminAuthService,
    AdminService,
    AdminRolesService,
    AppVersionsService,
  ],
})
export class AdminModule {}
