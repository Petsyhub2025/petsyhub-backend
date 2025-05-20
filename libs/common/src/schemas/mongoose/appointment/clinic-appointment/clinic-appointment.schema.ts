import { ModelNames } from '@common/constants';
import { DeepLinkModelsEnum } from '@common/enums';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { DeepLinkService, FirebaseDynamicLinkService } from '@common/helpers/services';
import { Schema, HydratedDocument } from 'mongoose';
import {
  ClinicAppointment,
  IClinicAppointmentInstanceMethods,
  IClinicAppointmentModel,
} from './clinic-appointment.type';
import { IBaseAppointmentModel } from '@common/schemas/mongoose/appointment/base-appointment.type';
import { AppointmentTypeEnum } from '@common/schemas/mongoose/appointment/base-appointment.enum';

export const ClinicAppointmentSchema = new Schema<
  ClinicAppointment,
  IClinicAppointmentModel,
  IClinicAppointmentInstanceMethods
>(
  {
    selectedServices: {
      type: [Schema.Types.ObjectId],
      ref: ModelNames.BRANCH_SERVICE_TYPE,
      required: true,
    },
    petHealthDescription: { type: String, required: false },

    medicalSpecialties: {
      type: [Schema.Types.ObjectId],
      ref: ModelNames.MEDICAL_SPECIALTY,
      required: true,
    },
  },
  { timestamps: true },
);

export function clinicAppointmentSchemaFactory(
  baseAppointmentModel: IBaseAppointmentModel,
  deepLinkService: DeepLinkService,
  firebaseDynamicLinkService: FirebaseDynamicLinkService,
) {
  ClinicAppointmentSchema.pre('validate', async function () {
    const deepLink = deepLinkService.generateUserDeepLink({
      modelName: DeepLinkModelsEnum.APPOINTMENTS,
      modelId: this._id.toString(),
    });

    const dynamicLink = await firebaseDynamicLinkService.generateFirebaseDynamicLink<ClinicAppointment>(
      this,
      ['petHealthDescription', 'status', 'date'],
      {
        link: deepLink,
        title: 'Clinic Appointment',
        description: this.petHealthDescription,
      },
    );

    this.dynamicLink = dynamicLink;
  });

  ClinicAppointmentSchema.pre('validate', async function () {
    await validateSchema(this, ClinicAppointment);
  });

  ClinicAppointmentSchema.methods.deleteDoc = async function (this: HydratedDocument<ClinicAppointment>) {
    await this.deleteOne();
  };

  const clinicAppointmentModel = baseAppointmentModel.discriminator(
    ModelNames.CLINIC_APPOINTMENT,
    ClinicAppointmentSchema,
    AppointmentTypeEnum.CLINIC,
  );

  return clinicAppointmentModel;
}
