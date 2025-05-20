import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { Schema, Connection, HydratedDocument } from 'mongoose';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { DynamicLinkSchema } from '@common/schemas/mongoose/common/dynamic-link';
import { AppointmentStatusEnum } from './base-appointment.enum';
import { BaseAppointment, IBaseAppointmentModel, IBaseAppointmentInstanceMethods } from './base-appointment.type';

export const BaseAppointmentSchema = new Schema<
  BaseAppointment,
  IBaseAppointmentModel,
  IBaseAppointmentInstanceMethods
>(
  {
    user: { type: Schema.Types.ObjectId, ref: ModelNames.USER, required: true },
    selectedPet: { type: Schema.Types.ObjectId, ref: ModelNames.PET, required: true },
    selectedPetType: { type: Schema.Types.ObjectId, ref: ModelNames.PET_TYPE, required: true },
    branch: { type: Schema.Types.ObjectId, ref: ModelNames.BASE_BRANCH, required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: AppointmentStatusEnum, default: AppointmentStatusEnum.PENDING },
    phoneNumber: { type: String, required: true },

    //address
    country: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.COUNTRY,
      required: true,
    },

    city: { type: Schema.Types.ObjectId, ref: ModelNames.CITY, required: true },

    area: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.AREA,
      required: function (this: HydratedDocument<BaseAppointment>) {
        return !!this.city;
      },
    },

    ...DynamicLinkSchema,
    ...BaseSchema,
  },
  {
    discriminatorKey: 'appointmentType',
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
      },
    },
  },
);

export function baseAppointmentSchemaFactory(connection: Connection) {
  BaseAppointmentSchema.index({ user: 1 });
  BaseAppointmentSchema.index({ selectedPet: 1 });
  BaseAppointmentSchema.index({ status: 1 });
  BaseAppointmentSchema.index({ date: 1 });
  BaseAppointmentSchema.index({ branch: 1 });

  BaseAppointmentSchema.pre('validate', async function () {
    await validateSchema(this, BaseAppointment);
  });

  BaseAppointmentSchema.methods.deleteDoc = async function (this: HydratedDocument<BaseAppointment>) {
    await this.deleteOne();
  };

  const baseAppointmentModel = connection.model(ModelNames.BASE_APPOINTMENT, BaseAppointmentSchema);

  return baseAppointmentModel;
}
