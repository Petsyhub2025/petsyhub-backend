import { Module } from '@nestjs/common';
import { ServiceProviderController } from './controllers/service-provider.controller';
import { ServiceProviderService } from './controllers/service-provider.service';
import { ServiceProviderJWTStrategy } from './strategies/service-provider-jwt.strategy';
import { ServiceProviderMongooseModule } from '@instapets-backend/common';

@Module({
  imports: [ServiceProviderMongooseModule],
  controllers: [ServiceProviderController],
  providers: [ServiceProviderService, ServiceProviderJWTStrategy],
})
export class ServiceProviderModule {}
