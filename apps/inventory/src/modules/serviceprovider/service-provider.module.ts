import { Module } from '@nestjs/common';
import { SharedModule } from '@inventory/shared/shared.module';
import { InventoryService } from './controllers/inventory.service';
import { InventoryController } from './controllers/inventory.controller';
import { BranchMongooseModule } from '@instapets-backend/common';

@Module({
  imports: [SharedModule, BranchMongooseModule],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class ServiceProviderModule {}
