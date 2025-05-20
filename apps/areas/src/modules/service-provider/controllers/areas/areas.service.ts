import { Inject, Injectable } from '@nestjs/common';
import { IAreaModel, ModelNames } from '@instapets-backend/common';
import { GetAreasQueryDto } from './dto/get-areas.dto';
import { Types } from 'mongoose';

@Injectable()
export class AreasService {
  constructor(@Inject(ModelNames.AREA) private readonly areaModel: IAreaModel) {}

  async getAreas(serviceProviderId: string, { cityId }: GetAreasQueryDto) {
    const areas = await this.areaModel
      .find(
        { city: new Types.ObjectId(cityId) },
        {
          _id: 1,
          name: 1,
          location: 1,
        },
      )
      .lean();
    return areas;
  }
}
