import { ModelNames } from '@common/constants';
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection, Types } from 'mongoose';
import { City, ICityModel } from '../../city/city.type';

@Injectable()
export class CountryHelperService {
  constructor(@InjectConnection() private connection: Connection) {}

  async propagateCountryDelete(countryId: string | Types.ObjectId, session: ClientSession) {
    const cityModel = this.connection.model<City, ICityModel>(ModelNames.CITY);

    const cityCursor = cityModel.find({ country: countryId }).session(session).cursor();

    for await (const city of cityCursor) {
      await city.deleteDoc(session);
    }
  }
}
