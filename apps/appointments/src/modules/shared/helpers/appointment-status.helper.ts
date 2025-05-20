import { ConflictException, Injectable } from '@nestjs/common';
import { BaseAppointment, AppointmentStatusEnum } from '@instapets-backend/common';
import { HydratedDocument } from 'mongoose';
import { errorManager } from '@appointments/shared/config/errors.config';

@Injectable()
export class AppointmentStatusValidator {
  private StatusHierarchy = {
    '': [AppointmentStatusEnum.PENDING],
    [AppointmentStatusEnum.PENDING]: [
      AppointmentStatusEnum.CONFIRMED,
      AppointmentStatusEnum.REJECTED,
      AppointmentStatusEnum.CANCELLED,
    ],
    [AppointmentStatusEnum.CONFIRMED]: [AppointmentStatusEnum.COMPLETED],
    [AppointmentStatusEnum.REJECTED]: [],
    [AppointmentStatusEnum.CANCELLED]: [],
    [AppointmentStatusEnum.COMPLETED]: [],
  };

  constructor() {
    /* TODO document why this constructor is empty */
  }

  isStatusValidForAppointment(appointment: HydratedDocument<BaseAppointment>, newStatus: AppointmentStatusEnum) {
    if (this.StatusHierarchy[appointment.status].includes(newStatus)) return true;

    throw new ConflictException(errorManager.APPOINTMENT_STATUS_NOT_VALID);
  }
}
