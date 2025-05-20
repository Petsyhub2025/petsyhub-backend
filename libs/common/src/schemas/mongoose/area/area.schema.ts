import { ModelNames } from '@common/constants';
import { Schema, Connection, HydratedDocument } from 'mongoose';
import { Area, IAreaInstanceMethods, IAreaModel } from './area.type';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { ClientSession } from 'mongoose';
import { BaseSchema } from '../base/base-schema';
import { LocalizedTextSchema } from '../common/localized-text';
import { PointLocationSchema } from '../common/point';

const AreaSchema = new Schema<Area, IAreaModel, IAreaInstanceMethods>(
  {
    name: {
      type: LocalizedTextSchema(),
      required: true,
    },

    city: { type: Schema.Types.ObjectId, ref: ModelNames.CITY, required: true },

    location: { type: PointLocationSchema, required: true, index: '2dsphere' },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function areaSchemaFactory(connection: Connection) {
  AreaSchema.index({ city: 1 });
  AreaSchema.index({ 'name.en': 1 });
  AreaSchema.index({ 'name.ar': 1 });

  AreaSchema.pre('validate', async function () {
    await validateSchema(this, Area);
  });

  AreaSchema.methods.deleteDoc = async function (this: HydratedDocument<Area>, session?: ClientSession) {
    await this.deleteOne({ session });
  };

  const areaModel = connection.model(ModelNames.AREA, AreaSchema);

  return areaModel;
}
