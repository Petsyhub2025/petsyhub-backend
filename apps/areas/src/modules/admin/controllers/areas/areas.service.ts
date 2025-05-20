import { errorManager } from '@areas/admin/shared/config/errors.config';
import { AreaIdParamDto } from '@areas/admin/shared/dto/area-id-param.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  Area,
  AreaAdminRpcPayload,
  IAreaModel,
  ICityModel,
  ISearchResponseData,
  IUserModel,
  ModelNames,
  RabbitExchanges,
  RabbitRoutingKeys,
  ResponsePayload,
  RpcResponse,
  addMaintainOrderStages,
  addPaginationStages,
} from '@instapets-backend/common';
import { Types } from 'mongoose';
import { getAreaPipeline } from './aggregations/area-pipeline.aggregation';
import { getAreasPipeline } from './aggregations/areas-pipeline.aggregation';
import { CreateAreaDto } from './dto/create-area.dto';
import { GetAreasQueryDto } from './dto/get-areas.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@Injectable()
export class AreasService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    @Inject(ModelNames.CITY) private cityModel: ICityModel,
    @Inject(ModelNames.AREA) private areaModel: IAreaModel,
    @Inject(ModelNames.USER) private userModel: IUserModel,
  ) {}

  async createArea(adminId: string, { location, name, cityId }: CreateAreaDto) {
    const city = await this.cityModel.findById(cityId);

    if (!city) {
      throw new NotFoundException(errorManager.CITY_NOT_FOUND);
    }

    const newArea = new this.areaModel({
      city: new Types.ObjectId(cityId),
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
      },
      name,
    });

    const savedArea = await newArea.save();

    return this.populateAreaById(savedArea._id);
  }

  async updateArea(adminId: string, { areaId }: AreaIdParamDto, body: UpdateAreaDto) {
    const { cityId, location } = body;

    const oldArea = await this.areaModel.findById(areaId);
    if (!oldArea) {
      throw new NotFoundException(errorManager.AREA_NOT_FOUND);
    }

    if (cityId) {
      const _city = await this.cityModel.findById(cityId, { _id: 1 }).lean();
      if (!_city) {
        throw new NotFoundException(errorManager.CITY_NOT_FOUND);
      }
    }

    oldArea.set({
      ...body,
      ...(location && {
        location: {
          type: 'Point',
          coordinates: [location.lng, location.lat],
        },
      }),
    });

    await oldArea.save();

    return this.populateAreaById(areaId);
  }

  async deleteArea(adminId: string, { areaId }: AreaIdParamDto) {
    const area = await this.areaModel.findById(areaId);

    if (!area) {
      throw new NotFoundException(errorManager.AREA_NOT_FOUND);
    }

    const userExistsInArea = await this.userModel.exists({ area: areaId });
    if (userExistsInArea) {
      throw new ForbiddenException(errorManager.AREA_HAS_USERS);
    }

    await area.deleteDoc();
  }

  async getAreas(adminId: string, query: GetAreasQueryDto): Promise<ResponsePayload<Area>> {
    const { page, limit, search, cityId } = query;

    if (search) {
      return this.getSearchedAreas(query);
    }

    const matchStage = [{ $match: { city: new Types.ObjectId(cityId) } }];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.areaModel.aggregate(matchStage).count('total'),
      this.areaModel.aggregate([...matchStage, ...addPaginationStages({ page, limit }), ...getAreasPipeline()]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  private async getSearchedAreas({ page, limit, search, cityId }: GetAreasQueryDto): Promise<ResponsePayload<Area>> {
    const payload: AreaAdminRpcPayload = {
      page,
      limit,
      search,
      cityId: cityId?.toString(),
    };

    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_AREAS_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const { _ids: searchIds, pages, total } = rpcResponse.data;

    const _ids = searchIds.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.areaModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getAreasPipeline(),
    ]);

    return {
      data: docs,
      total,
      limit,
      page,
      pages,
    };
  }

  async getAreaById(adminId: string, { areaId }: AreaIdParamDto) {
    return this.populateAreaById(areaId);
  }

  private async populateAreaById(areaId: string | Types.ObjectId): Promise<IAreaModel> {
    const [area] = await this.areaModel.aggregate([
      { $match: { _id: new Types.ObjectId(areaId) } },
      ...getAreaPipeline(),
    ]);

    if (!area) {
      throw new NotFoundException(errorManager.AREA_NOT_FOUND);
    }

    return area;
  }
}
