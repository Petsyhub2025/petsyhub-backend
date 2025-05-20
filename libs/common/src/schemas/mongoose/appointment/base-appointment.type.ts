import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsInstance, IsString, IsDate, IsEnum, ValidateIf, IsMobilePhone, IsOptional } from 'class-validator';
import { Types, Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { AppointmentStatusEnum, AppointmentTypeEnum } from './base-appointment.enum';

export class BaseAppointment extends BaseModel<BaseAppointment> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  user: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  selectedPet: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  selectedPetType: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  branch: Types.ObjectId;

  @IsMobilePhone()
  phoneNumber: string;

  @IsDate()
  date: Date;

  @IsOptional()
  @IsString()
  @IsEnum(AppointmentStatusEnum)
  status?: AppointmentStatusEnum;

  @IsString()
  @IsEnum(AppointmentTypeEnum)
  appointmentType: AppointmentTypeEnum;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  country: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  city: Types.ObjectId;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  area?: Types.ObjectId;
}
export interface IBaseAppointmentInstanceMethods extends IBaseInstanceMethods {}
export interface IBaseAppointmentModel
  extends Model<BaseAppointment, Record<string, unknown>, IBaseAppointmentInstanceMethods> {}
