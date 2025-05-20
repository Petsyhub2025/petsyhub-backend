import { SharedModule } from '@branches/shared/shared.module';
import { Module } from '@nestjs/common';
import { BranchesService } from './controllers/branches.service';
import { BranchesController } from './controllers/branches.controller';
import { AppointmentMongooseModule, UserMongooseModule } from '@instapets-backend/common';

@Module({
  imports: [SharedModule, UserMongooseModule, AppointmentMongooseModule],
  controllers: [BranchesController],
  providers: [BranchesService],
})
export class UserModule {}
