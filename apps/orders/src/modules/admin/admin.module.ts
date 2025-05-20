import { Module } from '@nestjs/common';
import { SharedModule } from '@orders/shared/shared.module';
import { OrdersService } from './controllers/orders.service';
import { OrdersController } from './controllers/orders.controller';

@Module({
  imports: [SharedModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class AdminModule {}
