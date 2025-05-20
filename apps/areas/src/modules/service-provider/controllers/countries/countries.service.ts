import { Inject, Injectable } from '@nestjs/common';
import { ICountryModel, ModelNames } from '@instapets-backend/common';

@Injectable()
export class CountriesService {
  constructor(@Inject(ModelNames.COUNTRY) private countryModel: ICountryModel) {}

  async getCountries(clinicId: string) {
    const countries = await this.countryModel.find({}, { _id: 1, name: 1, location: 1, countryCode: 1 });
    return { data: countries };
  }
}
