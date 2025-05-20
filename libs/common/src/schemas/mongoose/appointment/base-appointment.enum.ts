export enum AppointmentStatusEnum {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  MISSED = 'missed',
}

export enum AppointmentTypeEnum {
  CLINIC = 'clinic',
  HOSTEL = 'hostel',
  DAY_CARE = 'dayCare',
}

export enum AppointmentEventsEnum {
  SEND_APPOINTMENT_CREATION_NOTIFICATION = 'appointment.sendCreationNotification',
  SEND_APPOINTMENT_CONFIRMATION_NOTIFICATION = 'appointment.sendConfirmationNotification',
  SEND_APPOINTMENT_REJECTION_NOTIFICATION = 'appointment.sendRejectionNotification',
  SEND_APPOINTMENT_CANCELLATION_NOTIFICATION = 'appointment.sendCancellationNotification',
}
