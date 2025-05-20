import { Module } from '@nestjs/common';
import { CustomerController } from './controllers/customer.controller';
import { CustomerService } from './controllers/customer.service';
import { CustomerJWTStrategy } from './strategies/customer-jwt.strategy';
import { CustomerMongooseModule } from '@instapets-backend/common';

@Module({
  imports: [CustomerMongooseModule],
  controllers: [CustomerController],
  providers: [CustomerService, CustomerJWTStrategy],
})
export class CustomerModule {}
