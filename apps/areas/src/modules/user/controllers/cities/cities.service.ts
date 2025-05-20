import { Inject, Injectable } from '@nestjs/common';
import { ICityModel, ModelNames } from '@instapets-backend/common';
import { GetCitiesQueryDto } from './dto/get-cities.dto';

@Injectable()
export class CitiesService {
  constructor(@Inject(ModelNames.CITY) private readonly cityModel: ICityModel) {}

  async getCities(userId: string, { countryId }: GetCitiesQueryDto) {
    const cities = await this.cityModel
      .find(
        { country: countryId },
        {
          _id: 1,
          name: 1,
        },
      )
      .lean();
    return cities;
  }
}
