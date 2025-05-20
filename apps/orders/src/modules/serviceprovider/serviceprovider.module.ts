import { Module } from '@nestjs/common';
import { SharedModule } from '@orders/shared/shared.module';
import { OrdersService } from './controllers/orders.service';
import { OrdersController } from './controllers/orders.controller';
import { OrderStatusEnumValidator } from './controllers/order-status-validator.service';
import {
  BaseBranch,
  BranchMongooseModule,
  ServiceProviderMongooseModule,
  TemplateManagerService,
} from '@instapets-backend/common';
import { OrderEventListener } from './event-listeners/orders-events.listener';

@Module({
  imports: [SharedModule, ServiceProviderMongooseModule, BranchMongooseModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderStatusEnumValidator, OrderEventListener, TemplateManagerService],
})
export class ServiceProviderModule {}
