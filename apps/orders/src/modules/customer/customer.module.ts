import {
  AppConfig,
  AreaMongooseModule,
  BranchAccessControlMongooseModule,
  BranchMongooseModule,
  CartMongooseModule,
  CityMongooseModule,
  CountryMongooseModule,
  CustomerAddressMongooseModule,
  CustomerMongooseModule,
  InventoryMongooseModule,
  ProductMongooseModule,
  ServiceProviderMongooseModule,
  StripeModule,
  TemplateManagerService,
} from '@instapets-backend/common';
import { Module } from '@nestjs/common';
import { SharedModule } from '@orders/shared/shared.module';
import { OrdersService } from './controllers/orders.service';
import { OrdersController } from './controllers/orders.controller';
import { StripeWebhooksService } from './controllers/stripe-webhooks/stripe-webhooks.service';
import { StripeWebhooksController } from './controllers/stripe-webhooks/stripe-webhooks.controller';
import { CustomerOrderEventListener } from './event-listeners/orders-events.listener';

@Module({
  imports: [
    SharedModule,
    StripeModule.registerAsync({
      useFactory: (appConfig: AppConfig) => ({
        secretKey: appConfig.STRIPE_SECRET_KEY,
      }),
      inject: [AppConfig],
    }),
    CartMongooseModule,
    CustomerAddressMongooseModule,
    BranchMongooseModule,
    BranchAccessControlMongooseModule,
    InventoryMongooseModule,
    ServiceProviderMongooseModule,
    ProductMongooseModule,
    AreaMongooseModule,
    CityMongooseModule,
    CountryMongooseModule,
  ],
  controllers: [OrdersController, StripeWebhooksController],
  providers: [OrdersService, StripeWebhooksService, TemplateManagerService, CustomerOrderEventListener],
})
export class CustomerModule {}
