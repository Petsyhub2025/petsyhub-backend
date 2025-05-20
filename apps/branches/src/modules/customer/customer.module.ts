import { SharedModule } from '@branches/shared/shared.module';
import { Module } from '@nestjs/common';
import { BranchesService } from './controllers/branches.service';
import { BranchesController } from './controllers/branches.controller';
import { CustomerAddress, CustomerMongooseModule } from '@instapets-backend/common';

@Module({
  imports: [SharedModule, CustomerMongooseModule, CustomerAddress],
  controllers: [BranchesController],
  providers: [BranchesService],
})
export class CustomerModule {}
