import { ModelNames } from '@common/constants';
import { Schema, Connection, HydratedDocument } from 'mongoose';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { PetBreed, IPetBreedModel, IPetBreedInstanceMethods } from './pet-breed.type';
import { LocalizedTextSchema } from '@common/schemas/mongoose/common/localized-text';

const PetBreedSchema = new Schema<PetBreed, IPetBreedModel, IPetBreedInstanceMethods>(
  {
    type: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: ModelNames.PET_TYPE,
    },

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

export function petBreedSchemaFactory(connection: Connection) {
  PetBreedSchema.index({ type: 1, 'name.en': 1 }, { unique: true });
  PetBreedSchema.index({ type: 1, 'name.ar': 1 }, { unique: true });
  PetBreedSchema.index({ _id: 1, type: 1, 'name.en': 1 });
  PetBreedSchema.index({ _id: 1, type: 1, 'name.ar': 1 });
  PetBreedSchema.index({ type: 1 });

  PetBreedSchema.pre('validate', async function () {
    await validateSchema(this, PetBreed);
  });

  PetBreedSchema.methods.deleteDoc = async function (this: HydratedDocument<PetBreed>) {
    await this.deleteOne();
  };

  const petBreedModel = connection.model(ModelNames.PET_BREED, PetBreedSchema);

  return petBreedModel;
}
