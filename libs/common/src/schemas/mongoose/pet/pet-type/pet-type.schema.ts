import { ModelNames } from '@common/constants';
import { Schema, Connection, HydratedDocument } from 'mongoose';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { PetType, IPetTypeModel, IPetTypeInstanceMethods } from './pet-type.type';
import { LocalizedTextSchema } from '@common/schemas/mongoose/common/localized-text';

const PetTypeSchema = new Schema<PetType, IPetTypeModel, IPetTypeInstanceMethods>(
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

export function petTypeSchemaFactory(connection: Connection) {
  PetTypeSchema.index({ 'name.en': 1 }, { unique: true });
  PetTypeSchema.index({ 'name.ar': 1 }, { unique: true });
  PetTypeSchema.index({ _id: 1, name: 1 });

  PetTypeSchema.pre('validate', async function () {
    await validateSchema(this, PetType);
  });

  //TODO:ADD POST DELETE TO REMOVE ALL PETS AND BREEDS RELATED TO THIS TYPE?
  PetTypeSchema.methods.deleteDoc = async function (this: HydratedDocument<PetType>) {
    await this.deleteOne();
  };

  const petTypeModel = connection.model(ModelNames.PET_TYPE, PetTypeSchema);

  return petTypeModel;
}
