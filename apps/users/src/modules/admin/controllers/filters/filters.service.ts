import { ModelNames, RabbitExchanges, RabbitRoutingKeys } from '@common/constants';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  BaseSearchPaginationQuery,
  ISearchResponseData,
  IUserModel,
  ResponsePayload,
  RpcResponse,
  User,
  addMaintainOrderStages,
  addPaginationStages,
} from '@instapets-backend/common';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { errorManager } from '@users/admin/shared/config/errors.config';
import { PipelineStage, Types } from 'mongoose';
import { getUsersFilterOptionsPipeline } from './helpers/filters-pipeline.helper';

@Injectable()
export class FiltersService {
  constructor(
    @Inject(ModelNames.USER) private readonly userModel: IUserModel,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async getUsersFilterOptions(adminId: string, query: BaseSearchPaginationQuery): Promise<ResponsePayload<User>> {
    const { limit, page, search } = query;

    const matchStage: PipelineStage[] = [
      {
        $match: {},
      },
    ];

    if (search) {
      return this.getSearchedUsersFilterOptions(query);
    }

    const [pets, [{ total = 0 } = {}]] = await Promise.all([
      this.userModel.aggregate([
        ...matchStage,
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ limit, page }),
        ...getUsersFilterOptionsPipeline(),
      ]),
      this.userModel.aggregate([...matchStage]).count('total'),
    ]);

    return {
      data: pets,
      total,
      limit,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  private async getSearchedUsersFilterOptions({
    page,
    limit,
    search,
  }: BaseSearchPaginationQuery): Promise<ResponsePayload<User>> {
    const payload: BaseSearchPaginationQuery = {
      page,
      limit,
      search,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_USERS_SEARCH_FILTER_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.userModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getUsersFilterOptionsPipeline(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }
}
