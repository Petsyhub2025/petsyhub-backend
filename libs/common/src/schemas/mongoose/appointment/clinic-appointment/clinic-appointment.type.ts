import { TransformObjectIds } from '@common/decorators/class-transformer';
import { IsInstance, IsString, IsArray, ArrayNotEmpty, IsOptional } from 'class-validator';
import { Types, Model } from 'mongoose';
import { IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { BaseAppointment } from '@common/schemas/mongoose/appointment/base-appointment.type';

export class ClinicAppointment extends BaseAppointment {
  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @ArrayNotEmpty()
  selectedServices: Types.ObjectId[];

  @IsString()
  @IsOptional()
  petHealthDescription?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  medicalSpecialties: Types.ObjectId[];
}
export interface IClinicAppointmentInstanceMethods extends IBaseInstanceMethods {}
export interface IClinicAppointmentModel
  extends Model<ClinicAppointment, Record<string, unknown>, IClinicAppointmentInstanceMethods> {}
