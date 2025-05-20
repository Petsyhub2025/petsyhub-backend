import { IsMongoId } from 'class-validator';

export class AppointmentIdParamDto {
  @IsMongoId()
  appointmentId: string;
}
