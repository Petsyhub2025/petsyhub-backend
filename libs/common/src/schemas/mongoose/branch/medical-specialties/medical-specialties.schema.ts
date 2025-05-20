import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { Connection, HydratedDocument, Schema } from 'mongoose';
import { MedicalSpecialty, IMedicalSpecialtyInstanceMethods, IMedicalSpecialtyModel } from './medical-specialties.type';
import { LocalizedTextSchema } from '@common/schemas/mongoose/common/localized-text';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';

const MedicalSpecialtySchema = new Schema<MedicalSpecialty, IMedicalSpecialtyModel, IMedicalSpecialtyInstanceMethods>(
  {
    name: {
      type: LocalizedTextSchema(),
      required: true,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function medicalSpecialtySchemaFactory(connection: Connection) {
  MedicalSpecialtySchema.index({ 'name.en': 1 }, { unique: true });
  MedicalSpecialtySchema.index({ 'name.ar': 1 }, { unique: true });
  MedicalSpecialtySchema.index({ _id: 1, name: 1 });

  MedicalSpecialtySchema.pre('validate', async function () {
    await validateSchema(this, MedicalSpecialty);
  });

  //TODO:ADD POST DELETE TO REMOVE ALL branches related to this specialty?
  MedicalSpecialtySchema.methods.deleteDoc = async function (this: HydratedDocument<MedicalSpecialty>) {
    // await this.deleteOne();
  };

  const medicalSpecialtyModel = connection.model(ModelNames.MEDICAL_SPECIALTY, MedicalSpecialtySchema);

  return medicalSpecialtyModel;
}
