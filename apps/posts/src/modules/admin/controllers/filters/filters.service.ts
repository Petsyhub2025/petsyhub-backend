import { ModelNames, RabbitExchanges, RabbitRoutingKeys } from '@common/constants';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  BaseSearchPaginationQuery,
  IPostModel,
  ISearchResponseData,
  Post,
  ResponsePayload,
  RpcResponse,
  addMaintainOrderStages,
  addPaginationStages,
} from '@instapets-backend/common';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PipelineStage, Types } from 'mongoose';
import { getPostsFilterPipeline } from './helpers/filters-pipeline.helper';
import { errorManager } from '@posts/admin/shared/config/error-manager.config';

@Injectable()
export class FiltersService {
  constructor(
    @Inject(ModelNames.POST) private readonly postModel: IPostModel,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async getPostsFilterOptions(adminId: string, query: BaseSearchPaginationQuery): Promise<ResponsePayload<Post>> {
    const { limit, page, search } = query;

    const matchStage: PipelineStage[] = [
      {
        $match: {},
      },
    ];

    if (search) {
      return this.getSearchedPostsFilterOptions(query);
    }

    const [pets, [{ total = 0 } = {}]] = await Promise.all([
      this.postModel.aggregate([
        ...matchStage,
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ limit, page }),
        ...getPostsFilterPipeline(),
      ]),
      this.postModel.aggregate([...matchStage]).count('total'),
    ]);

    return {
      data: pets,
      total,
      limit,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  private async getSearchedPostsFilterOptions({
    page,
    limit,
    search,
  }: BaseSearchPaginationQuery): Promise<ResponsePayload<Post>> {
    const payload: BaseSearchPaginationQuery = {
      page,
      limit,
      search,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_POSTS_SEARCH_FILTER_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.postModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getPostsFilterPipeline(),
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
