import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SharedModule } from '@users/shared/shared.module';
import {
  AppConfig,
  AwsCognitoModule,
  AwsS3Module,
  PendingUserMongooseModule,
  PostMongooseModule,
  TopicMongooseModule,
  UserAddressMongooseModule,
  UserBlockMongooseModule,
  UserTopicMongooseModule,
} from '@instapets-backend/common';
import { UserAddressController } from './controllers/user-address/user-address.controller';
import { UserAddressService } from './controllers/user-address/user-address.service';
import { LoginEmailGuard } from './controllers/user-auth/guards/login-email.guard';
import { RefreshTokenGuard } from './controllers/user-auth/guards/refresh-token.guard';
import { LoginEmailStrategyService } from './controllers/user-auth/strategies/login-email/login-email-strategy.service';
import { LoginEmailStrategy } from './controllers/user-auth/strategies/login-email/login-email.strategy';
import { RefreshTokenStrategyService } from './controllers/user-auth/strategies/refresh-token/refresh-token-strategy.service';
import { RefreshTokenStrategy } from './controllers/user-auth/strategies/refresh-token/refresh-token.strategy';
import { UserAuthController } from './controllers/user-auth/user-auth.controller';
import { UserAuthService } from './controllers/user-auth/user-auth.service';
import { UserProfileController } from './controllers/user-profile/user-profile.controller';
import { UserProfileService } from './controllers/user-profile/user-profile.service';
import { UserController } from './controllers/user/user.controller';
import { UserService } from './controllers/user/user.service';
import { PendingUserFollowEventListener } from './event-listeners/pending-user-follow.listener';
import { UserFollowEventListener } from './event-listeners/user-follow.listener';
import { AppVersionsController } from './controllers/app-versions/app-versions.controller';
import { AppVersionsService } from './controllers/app-versions/app-versions.service';
import { transformRequestEmails } from './controllers/user-auth/middlewares/transform-email.middleware';
import { UserOnboardingController } from './controllers/user-onboarding/user-onboarding.controller';
import { UserOnboardingService } from './controllers/user-onboarding/user-onboarding.service';
import { UserTopicService } from './controllers/user-topic/user-topic.service';
import { UserTopicController } from './controllers/user-topic/user-topic.controller';
import { TemplateManagerService } from '@instapets-backend/common';

@Module({
  imports: [
    SharedModule,
    UserAddressMongooseModule,
    PendingUserMongooseModule,
    UserBlockMongooseModule,
    UserTopicMongooseModule,
    TopicMongooseModule,
    PostMongooseModule,
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
  ],
  controllers: [
    UserAuthController,
    UserProfileController,
    UserAddressController,
    UserController,
    AppVersionsController,
    UserOnboardingController,
    UserTopicController,
  ],
  providers: [
    UserAuthService,
    UserProfileService,
    UserAddressService,
    RefreshTokenStrategyService,
    RefreshTokenStrategy,
    RefreshTokenGuard,
    LoginEmailGuard,
    LoginEmailStrategy,
    LoginEmailStrategyService,
    UserService,
    UserFollowEventListener,
    PendingUserFollowEventListener,
    AppVersionsService,
    UserOnboardingService,
    UserTopicService,
    TemplateManagerService,
  ],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(transformRequestEmails).forRoutes(UserAuthController);
  }
}
