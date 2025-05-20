import { errorManager } from '@areas/admin/shared/config/errors.config';
import { CityIdParamDto } from '@areas/admin/shared/dto/city-id-param.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  City,
  CityAdminRpcPayload,
  ICityModel,
  ICountryModel,
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
import { CreateCityDto } from './dto/create-city.dto';
import { GetCitiesQueryDto } from './dto/get-cities.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { getCitiesPipeline } from './helpers/city-pipeline.helper';

@Injectable()
export class CitiesService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    @Inject(ModelNames.COUNTRY) private countryModel: ICountryModel,
    @Inject(ModelNames.CITY) private cityModel: ICityModel,
    @Inject(ModelNames.USER) private userModel: IUserModel,
  ) {}

  async createCity(adminJWT: string, { location, name, countryId }: CreateCityDto) {
    const country = await this.countryModel.findById(countryId);

    if (!country) {
      throw new NotFoundException(errorManager.COUNTRY_NOT_FOUND);
    }

    const newCity = new this.cityModel({
      country: countryId,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
      },
      name,
    });

    const savedCity = await newCity.save();

    const city = await this.cityModel
      .findById(savedCity._id, {
        _id: 1,
        country: 1,
        name: 1,
        location: 1,
      })
      .populate({
        path: 'country',
        select: {
          _id: 1,
          name: 1,
        },
      });

    return city;
  }

  async updateCity(adminJWT: string, { cityId }: CityIdParamDto, body: UpdateCityDto) {
    const { country, location } = body;

    const oldCity = await this.cityModel.findById(cityId);
    if (!oldCity) {
      throw new NotFoundException(errorManager.CITY_NOT_FOUND);
    }

    if (country) {
      const _country = await this.countryModel.findById(country, { _id: 1 }).lean();
      if (!_country) {
        throw new NotFoundException(errorManager.COUNTRY_NOT_FOUND);
      }
    }

    oldCity.set({
      ...body,
      ...(location && {
        location: {
          type: 'Point',
          coordinates: [location.lng, location.lat],
        },
      }),
    });

    await oldCity.save();

    const city = await this.cityModel
      .findById(oldCity._id, {
        _id: 1,
        country: 1,
        name: 1,
        location: 1,
      })
      .populate({
        path: 'country',
        select: {
          _id: 1,
          name: 1,
        },
      });

    return city;
  }

  async deleteCity(adminJWT: string, { cityId }: CityIdParamDto) {
    const city = await this.cityModel.findById(cityId);

    if (!city) {
      throw new NotFoundException(errorManager.CITY_NOT_FOUND);
    }

    const userExistsInCity = await this.userModel.exists({ city: cityId });
    if (userExistsInCity) {
      throw new ForbiddenException(errorManager.CITY_HAS_USERS);
    }

    await city.deleteDoc();
  }

  async getCities(adminJWT: string, query: GetCitiesQueryDto): Promise<ResponsePayload<City>> {
    const { page, limit, search, countryId } = query;

    if (search) {
      return this.getSearchedCities(query);
    }
    const matchStage = [{ $match: { ...(countryId ? { country: new Types.ObjectId(countryId) } : {}) } }];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.cityModel.aggregate(matchStage).count('total'),
      this.cityModel.aggregate([...matchStage, ...addPaginationStages({ page, limit }), ...getCitiesPipeline()]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  private async getSearchedCities({
    page,
    limit,
    search,
    countryId,
  }: GetCitiesQueryDto): Promise<ResponsePayload<City>> {
    const payload: CityAdminRpcPayload = {
      page,
      limit,
      search,
      countryId,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_CITIES_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.cityModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getCitiesPipeline(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getCityById(adminJWT: string, { cityId }: CityIdParamDto) {
    const city = await this.cityModel
      .findById(cityId, {
        _id: 1,
        location: 1,
        name: 1,
      })
      .populate({
        path: 'country',
        select: {
          _id: 1,
          name: 1,
        },
      })
      .lean();
    if (!city) {
      throw new NotFoundException(errorManager.CITY_NOT_FOUND);
    }

    return city;
  }
}
