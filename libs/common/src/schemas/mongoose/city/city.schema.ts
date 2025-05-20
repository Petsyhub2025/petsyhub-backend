import { ModelNames } from '@common/constants';
import { Schema, Connection, HydratedDocument, ClientSession } from 'mongoose';
import { City, ICityInstanceMethods, ICityModel } from './city.type';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { CityHelperService } from './services/city-helper.service';
import { BaseSchema } from '../base/base-schema';
import { LocalizedTextSchema } from '../common/localized-text';
import { PointLocationSchema } from '../common/point';

const CitySchema = new Schema<City, ICityModel, ICityInstanceMethods>(
  {
    name: {
      type: LocalizedTextSchema(),
      required: true,
    },

    country: { type: Schema.Types.ObjectId, ref: ModelNames.COUNTRY, required: true },

    location: { type: PointLocationSchema, required: true, index: '2dsphere' },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function citySchemaFactory(connection: Connection, cityHelperService: CityHelperService) {
  CitySchema.index({ country: 1 });
  CitySchema.index({ 'name.en': 1 });
  CitySchema.index({ 'name.ar': 1 });

  CitySchema.pre('validate', async function () {
    await validateSchema(this, City);
  });

  CitySchema.methods.deleteDoc = async function (this: HydratedDocument<City>, _session?: ClientSession) {
    if (_session) {
      await _deleteDoc.call(this, _session);
      return;
    }

    const session = await connection.startSession();
    session.startTransaction({
      readPreference: 'primary',
    });

    try {
      await _deleteDoc.call(this, session);
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();

      throw error;
    } finally {
      session.endSession();
    }
  };

  async function _deleteDoc(this: HydratedDocument<City>, session?: ClientSession) {
    await this.deleteOne({ session });

    await cityHelperService.propagateCityDelete(this._id, session);
  }

  const cityModel = connection.model(ModelNames.CITY, CitySchema);

  return cityModel;
}
