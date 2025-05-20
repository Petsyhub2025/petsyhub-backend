import { Inject, Injectable } from '@nestjs/common';
import { City, ICityModel, ModelNames, ResponsePayload } from '@instapets-backend/common';
import { GetCitiesQueryDto } from './dto/get-cities.dto';
import { Types } from 'mongoose';

@Injectable()
export class CitiesService {
  constructor(@Inject(ModelNames.CITY) private cityModel: ICityModel) {}

  async getCities(clinicJwt: string, query: GetCitiesQueryDto): Promise<ResponsePayload<City>> {
    const { countryId } = query;

    const cities = await this.cityModel.find(
      { country: new Types.ObjectId(countryId) },
      { _id: 1, name: 1, location: 1 },
    );
    return { data: cities };
  }
}
