import { ModelNames } from '@common/constants';
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection, Types } from 'mongoose';
import { Area, IAreaModel } from '../../area';

@Injectable()
export class CityHelperService {
  constructor(@InjectConnection() private connection: Connection) {}

  async propagateCityDelete(cityId: string | Types.ObjectId, session: ClientSession) {
    const areaModel = this.connection.model<Area, IAreaModel>(ModelNames.AREA);

    const areaCursor = areaModel.find({ city: cityId }).session(session).cursor();

    for await (const area of areaCursor) {
      await area.deleteDoc(session);
    }
  }
}
