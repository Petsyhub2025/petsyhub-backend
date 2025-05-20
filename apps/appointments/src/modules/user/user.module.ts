import { Module } from '@nestjs/common';
import { SharedModule } from '@appointments/shared/shared.module';
import { BranchMongooseModule, UserMongooseModule } from '@instapets-backend/common';
import { AppointmentsService } from './controllers/appointments.service';
import { AppointmentsController } from './controllers/appointments.controller';
import { AppointmentStatusValidator } from '@appointments/shared/helpers/appointment-status.helper';

@Module({
  imports: [SharedModule, UserMongooseModule, BranchMongooseModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentStatusValidator],
})
export class UserModule {}
