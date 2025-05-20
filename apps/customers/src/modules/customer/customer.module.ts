import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SharedModule } from '@customers/shared/shared.module';
import {
  AppConfig,
  AwsS3Module,
  BranchMongooseModule,
  CartMongooseModule,
  Customer,
  CustomerAddressMongooseModule,
  CustomerMongooseModule,
  FavoriteMongooseModule,
  InventoryMongooseModule,
  Order,
  OrderMongooseModule,
  PendingCustomerMongooseModule,
  ProductMongooseModule,
  StripeModule,
} from '@instapets-backend/common';
import { transformRequestEmails } from './controllers/customer-auth/middlewares/transform-email.middleware';
import { CustomerAuthController } from './controllers/customer-auth/customer-auth.controller';
import { CustomerAuthService } from './controllers/customer-auth/customer-auth.service';
import { LoginEmailStrategyService } from './controllers/customer-auth/strategies/login-email/login-email-strategy.service';
import { LoginEmailStrategy } from './controllers/customer-auth/strategies/login-email/login-email.strategy';
import { LoginEmailGuard } from './controllers/customer-auth/guards/login-email.guard';
import { RefreshTokenGuard } from './controllers/customer-auth/guards/refresh-token.guard';
import { RefreshTokenStrategy } from './controllers/customer-auth/strategies/refresh-token/refresh-token.strategy';
import { RefreshTokenStrategyService } from './controllers/customer-auth/strategies/refresh-token/refresh-token-strategy.service';
import { CustomerAddressService } from './controllers/customer-address/customer-address.service';
import { CustomerAddressController } from './controllers/customer-address/customer-address.controller';
import { CartService } from './controllers/cart/cart.service';
import { CartController } from './controllers/cart/cart.controller';
import { PaymentMethodsService } from './controllers/payment-methods/payment-methods.service';
import { PaymentMethodsController } from './controllers/payment-methods/payment-methods.controller';
import { CustomerProfileController } from './controllers/customer-profile/customer-profile.controller';
import { CustomerProfileService } from './controllers/customer-profile/customer-profile.service';
import { FavoriteController } from './controllers/favorite/favorite.controller';
import { FavoriteService } from './controllers/favorite/favorite.service';
import { TemplateManagerService } from '@instapets-backend/common';
import { CustomerAuthEventListener } from './event-listeners/customer-auth.listener';

@Module({
  imports: [
    SharedModule,
    CustomerAddressMongooseModule,
    PendingCustomerMongooseModule,
    ProductMongooseModule,
    InventoryMongooseModule,
    CartMongooseModule,
    BranchMongooseModule,
    FavoriteMongooseModule,
    CustomerMongooseModule,
    OrderMongooseModule,
    PassportModule.register({ session: false, property: 'persona' }),
    AwsS3Module.registerAsync({
      useFactory: (appConfig: AppConfig) => ({
        accessKeyId: appConfig.AWS_UPLOAD_ACCESS_KEY_ID,
        secretAccessKey: appConfig.AWS_UPLOAD_SECRET_ACCESS_KEY,
        region: appConfig.AWS_UPLOAD_REGION,
      }),
      inject: [AppConfig],
    }),
    StripeModule.registerAsync({
      useFactory: (appConfig: AppConfig) => ({
        secretKey: appConfig.STRIPE_SECRET_KEY,
      }),
      inject: [AppConfig],
    }),
  ],
  controllers: [
    CustomerAuthController,
    CustomerAddressController,
    CartController,
    PaymentMethodsController,
    CustomerProfileController,
    FavoriteController,
  ],
  providers: [
    CustomerAuthService,
    LoginEmailStrategy,
    LoginEmailStrategyService,
    LoginEmailGuard,
    RefreshTokenGuard,
    RefreshTokenStrategy,
    RefreshTokenStrategyService,
    CustomerAddressService,
    CartService,
    PaymentMethodsService,
    CustomerProfileService,
    FavoriteService,
    TemplateManagerService,
    CustomerAuthEventListener,
  ],
})
export class CustomerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(transformRequestEmails).forRoutes(CustomerAuthController);
  }
}
