import { Module } from '@nestjs/common';
import { SharedModule } from '@appointments/shared/shared.module';
import { AppointmentStatusValidator } from '@appointments/shared/helpers/appointment-status.helper';
import { AppointmentsService } from './controllers/appointments.service';
import { ServiceProviderAppointmentEventListener } from './event-listeners/appointment.listener';
import { AppointmentsController } from './controllers/appointments.controller';
import { UserMongooseModule } from '@instapets-backend/common';

@Module({
  imports: [SharedModule, UserMongooseModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, ServiceProviderAppointmentEventListener, AppointmentStatusValidator],
})
export class ServiceProviderModule {}
