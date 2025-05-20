import { Module } from '@nestjs/common';
import { SharedModule } from '@discovery/shared/shared.module';
import { DiscoveryController } from './controllers/discovery/discovery.controller';
import { DiscoveryService } from './controllers/discovery/discovery.service';

@Module({
  imports: [SharedModule],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
})
export class UserModule {}
