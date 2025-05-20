import { ProviderIdParamDto } from '@serviceproviders/admin/shared/dto/provider-id-param.dto';
import { errorManager } from '@serviceproviders/admin/shared/config/errors.config';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import {
  BaseSearchPaginationQuery,
  ISearchResponseData,
  IServiceProviderModel,
  ModelNames,
  RabbitExchanges,
  RabbitRoutingKeys,
  ResponsePayload,
  RpcResponse,
  ServiceProvider,
  ServiceProviderRpcPayload,
  addMaintainOrderStages,
  addPaginationStages,
} from '@instapets-backend/common';
import { Types } from 'mongoose';
import { getServiceProvidersPipeline } from './helpers/service-providers-pipeline.helper';

@Injectable()
export class ServiceProvidersService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    @Inject(ModelNames.SERVICE_PROVIDER) private readonly serviceProviderModel: IServiceProviderModel,
  ) {}

  async getServiceProviders(
    adminId: string,
    query: BaseSearchPaginationQuery,
  ): Promise<ResponsePayload<ServiceProvider>> {
    const { page, limit, search } = query;

    if (search) {
      return this.getSearchedServiceProviders(query);
    }

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.serviceProviderModel.aggregate().count('total'),
      this.serviceProviderModel.aggregate([...addPaginationStages({ limit, page }), ...getServiceProvidersPipeline()]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  private async getSearchedServiceProviders({
    page,
    limit,
    search,
  }: BaseSearchPaginationQuery): Promise<ResponsePayload<ServiceProvider>> {
    const payload: ServiceProviderRpcPayload = {
      page,
      limit,
      search,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_SERVICE_PROVIDERS_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.serviceProviderModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getServiceProvidersPipeline(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getServiceProviderById(adminId: string, { providerId }: ProviderIdParamDto) {
    const [serviceProvider] = await this.serviceProviderModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(providerId),
        },
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          email: 1,
          phoneNumber: 1,
        },
      },
    ]);

    if (!serviceProvider) {
      throw new NotFoundException(errorManager.SERVICE_PROVIDER_NOT_FOUND);
    }

    return serviceProvider;
  }
}
