import { errorManager } from '@areas/admin/shared/config/errors.config';
import { CountryIdParamDto } from '@areas/admin/shared/dto/country-id-param.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  BaseSearchPaginationQuery,
  Country,
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
import { CreateCountryBodyDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { getCountriesPipeline } from './helpers/countries-pipeline.helper';

@Injectable()
export class CountriesService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    @Inject(ModelNames.COUNTRY) private countryModel: ICountryModel,
    @Inject(ModelNames.USER) private userModel: IUserModel,
  ) {}

  async createCountry(
    adminId: string,
    { countryCode, dialCode, location, name, countryCurrency }: CreateCountryBodyDto,
  ) {
    if (await this.countryModel.exists({ countryCode })) {
      throw new ConflictException(errorManager.COUNTRY_ALREADY_EXISTS);
    }

    const newCountry = new this.countryModel({
      countryCode,
      dialCode,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
      },
      name,
      countryCurrency,
    });

    const savedCountry = await newCountry.save();

    const country = await this.countryModel.findById(savedCountry._id, {
      _id: 1,
      countryCode: 1,
      dialCode: 1,
      location: 1,
      name: 1,
    });

    return country;
  }

  async updateCountry(adminId: string, { countryId }: CountryIdParamDto, body: UpdateCountryDto) {
    const { countryCode, location } = body;

    const oldCountry = await this.countryModel.findById(countryId);
    if (!oldCountry) {
      throw new NotFoundException(errorManager.COUNTRY_NOT_FOUND);
    }

    if (countryCode) {
      if (await this.countryModel.exists({ _id: { $ne: countryId }, countryCode })) {
        throw new ConflictException(errorManager.COUNTRY_ALREADY_EXISTS);
      }
    }

    oldCountry.set({
      ...body,
      ...(location && {
        location: {
          type: 'Point',
          coordinates: [location.lng, location.lat],
        },
      }),
    });

    await oldCountry.save();

    const country = await this.countryModel.findById(oldCountry._id, {
      _id: 1,
      countryCode: 1,
      dialCode: 1,
      location: 1,
      name: 1,
      countryCurrency: 1,
    });

    return country;
  }

  async deleteCountry(adminId: string, { countryId }: CountryIdParamDto) {
    const country = await this.countryModel.findById(countryId);
    if (!country) {
      throw new NotFoundException(errorManager.COUNTRY_NOT_FOUND);
    }

    const userExistsInCountry = await this.userModel.exists({ country: countryId });
    if (userExistsInCountry) {
      throw new ForbiddenException(errorManager.COUNTRY_HAS_USERS);
    }

    await country.deleteDoc();
  }

  async getCountries(adminId: string, query: BaseSearchPaginationQuery): Promise<ResponsePayload<Country>> {
    const { page, limit, search } = query;
    if (search) {
      return this.getSearchedCountries(query);
    }
    const matchStage = [{ $match: {} }];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.countryModel.aggregate(matchStage).count('total'),
      this.countryModel.aggregate([...matchStage, ...addPaginationStages({ page, limit }), ...getCountriesPipeline()]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  private async getSearchedCountries({
    page,
    limit,
    search,
  }: BaseSearchPaginationQuery): Promise<ResponsePayload<Country>> {
    const payload: BaseSearchPaginationQuery = {
      page,
      limit,
      search,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_COUNTRIES_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.countryModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getCountriesPipeline(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getCountryById(adminId: string, { countryId }: CountryIdParamDto) {
    const country = await this.countryModel
      .findById(countryId, {
        _id: 1,
        countryCode: 1,
        dialCode: 1,
        location: 1,
        name: 1,
      })
      .lean();
    if (!country) {
      throw new NotFoundException(errorManager.COUNTRY_NOT_FOUND);
    }

    return country;
  }
}
