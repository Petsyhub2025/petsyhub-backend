import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SharedModule } from '@serviceproviders/shared/shared.module';
import {
  AppConfig,
  AwsS3Module,
  BrandMembershipMongooseModule,
  BranchMongooseModule,
  BrandMongooseModule,
  AwsCognitoModule,
  BranchAccessControlMongooseModule,
  OrderMongooseModule,
  CustomerMongooseModule,
} from '@instapets-backend/common';
import { ServiceProviderAuthController } from './controllers/serviceprovider-auth/serviceprovider-auth.controller';
import { ServiceProviderAuthService } from './controllers/serviceprovider-auth/serviceprovider-auth.service';
import { LoginEmailStrategy } from './controllers/serviceprovider-auth/strategies/login-email/login-email.strategy';
import { RefreshTokenStrategy } from './controllers/serviceprovider-auth/strategies/refresh-token/refresh-token.strategy';
import { RefreshTokenStrategyService } from './controllers/serviceprovider-auth/strategies/refresh-token/refresh-token-strategy.service';
import { ServiceProviderProfileController } from './controllers/serviceprovider/serviceprovider.controller';
import { ServiceProviderProfileService } from './controllers/serviceprovider/serviceprovider.service';
import { LoginEmailStrategyService } from './controllers/serviceprovider-auth/strategies/login-email/login-email-strategy.service';
import { LoginEmailGuard } from './controllers/serviceprovider-auth/guards/login-email.guard';
import { RefreshTokenGuard } from './controllers/serviceprovider-auth/guards/refresh-token.guard';
import { TemplateManagerService } from '@instapets-backend/common';
import { ServiceProviderAuthEventListener } from './event-listeners/service-provider-auth.listener';

@Module({
  imports: [
    SharedModule,
    PassportModule.register({ session: false, property: 'persona' }),
    AwsS3Module.registerAsync({
      useFactory: (appConfig: AppConfig) => ({
        accessKeyId: appConfig.AWS_UPLOAD_ACCESS_KEY_ID,
        secretAccessKey: appConfig.AWS_UPLOAD_SECRET_ACCESS_KEY,
        region: appConfig.AWS_UPLOAD_REGION,
      }),
      inject: [AppConfig],
    }),
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
    BrandMembershipMongooseModule,
    BrandMongooseModule,
    BranchMongooseModule,
    BranchAccessControlMongooseModule,
    OrderMongooseModule,
    CustomerMongooseModule,
  ],
  controllers: [ServiceProviderAuthController, ServiceProviderProfileController],
  providers: [
    ServiceProviderAuthService,
    LoginEmailStrategy,
    LoginEmailStrategyService,
    RefreshTokenStrategy,
    RefreshTokenStrategyService,
    ServiceProviderProfileService,
    LoginEmailGuard,
    RefreshTokenGuard,
    TemplateManagerService,
    ServiceProviderAuthEventListener,
  ],
})
export class ServiceProviderModule {}
