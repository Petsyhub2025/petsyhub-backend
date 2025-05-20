import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { Connection, HydratedDocument, Schema } from 'mongoose';
import { CountryNameSchema } from './country-name';
import { CountryCodesEnum, CountryCurrenciesEnum, CountryDialCodesEnum } from './country.enum';
import { Country, ICountryInstanceMethods, ICountryModel } from './country.type';
import { CountryHelperService } from './services/country-helper.service';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { PointLocationSchema } from '@common/schemas/mongoose/common/point';

const CountrySchema = new Schema<Country, ICountryModel, ICountryInstanceMethods>(
  {
    name: {
      type: CountryNameSchema,
      required: true,
    },

    dialCode: {
      type: String,
      enum: CountryDialCodesEnum,
      trim: true,
    },

    countryCode: {
      type: String,
      enum: CountryCodesEnum,
      trim: true,
    },

    location: { type: PointLocationSchema, required: true, index: '2dsphere' },

    countryCurrency: {
      type: String,
      enum: CountryCurrenciesEnum,
      trim: true,
      required: false,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function countrySchemaFactory(connection: Connection, countryHelperService: CountryHelperService) {
  CountrySchema.index({ 'name.en': 1 }, { unique: true });
  CountrySchema.index({ 'name.ar': 1 }, { unique: true });
  CountrySchema.index({ 'name.abbr': 1 });
  CountrySchema.index({ dialCode: 1 });
  CountrySchema.index({ countryCode: 1 });
  CountrySchema.index({ _id: 1, countryCode: 1 });

  CountrySchema.pre('validate', async function () {
    await validateSchema(this, Country);
  });

  CountrySchema.methods.deleteDoc = async function (this: HydratedDocument<Country>) {
    const session = await connection.startSession();
    session.startTransaction({
      readPreference: 'primary',
    });

    try {
      await this.deleteOne({ session });

      await countryHelperService.propagateCountryDelete(this._id, session);

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  };

  const countryModel = connection.model(ModelNames.COUNTRY, CountrySchema);

  return countryModel;
}
