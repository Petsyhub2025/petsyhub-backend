import { Inject, Injectable } from '@nestjs/common';
import { IAreaModel, ModelNames } from '@instapets-backend/common';
import { GetAreasQueryDto } from './dto/get-areas.dto';
import { GetNearestAreasQueryDto } from './dto/get-nearest-areas.dto';

@Injectable()
export class AreasService {
  constructor(@Inject(ModelNames.AREA) private readonly areaModel: IAreaModel) {}

  async getAreas(userId: string, { cityId }: GetAreasQueryDto) {
    const areas = await this.areaModel
      .find(
        { city: cityId },
        {
          _id: 1,
          name: 1,
        },
      )
      .lean();
    return areas;
  }

  async getNearestAreas(userId: string, { lat, lng }: GetNearestAreasQueryDto) {
    const areas = await this.areaModel.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          distanceField: 'distance',
          spherical: true,
          maxDistance: 10000,
        },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          _id: 1,
          name: 1,
        },
      },
    ]);

    return areas;
  }
}
