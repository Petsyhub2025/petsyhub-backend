import { Inject, Injectable } from '@nestjs/common';
import { IAreaModel, ICityModel, ICountryModel, ModelNames } from '@instapets-backend/common';
import { GetCitiesFilterOptionsQueryDto } from './dto/get-filter-cities.dto';
import { GetAreasFilterOptionsQueryDto } from './dto/get-filter-areas.dto';

@Injectable()
export class FiltersService {
  constructor(
    @Inject(ModelNames.COUNTRY) private countryModel: ICountryModel,
    @Inject(ModelNames.CITY) private cityModel: ICityModel,
    @Inject(ModelNames.AREA) private areaModel: IAreaModel,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getCountryFilters(adminId: string) {
    return await this.countryModel.find({}, { _id: 1, name: 1 }).lean();
  }

  async getCityFilters(adminId: string, { countryId }: GetCitiesFilterOptionsQueryDto) {
    return this.cityModel.find({ country: countryId }, { _id: 1, name: 1 }).lean();
  }

  async getAreaFilters(adminId: string, { cityId }: GetAreasFilterOptionsQueryDto) {
    return this.areaModel.find({ city: cityId }, { _id: 1, name: 1 }).lean();
  }
}
