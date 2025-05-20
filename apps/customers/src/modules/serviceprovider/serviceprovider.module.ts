import { Module } from '@nestjs/common';
import { CustomersController } from './controllers/customers/customers.controller';
import { CustomersService } from './controllers/customers/customers.service';
import { SharedModule } from '@customers/shared/shared.module';
import { OrderMongooseModule } from '@instapets-backend/common';

@Module({
  imports: [SharedModule, OrderMongooseModule],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class ServiceProviderModule {}
