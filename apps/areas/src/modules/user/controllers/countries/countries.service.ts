import { Inject, Injectable } from '@nestjs/common';
import { ICountryModel, ModelNames } from '@instapets-backend/common';

@Injectable()
export class CountriesService {
  constructor(@Inject(ModelNames.COUNTRY) private readonly countryModel: ICountryModel) {}

  async getCountries(userId: string) {
    const countries = await this.countryModel.find({}, { _id: 1, name: 1 }).lean();
    return countries;
  }
}
