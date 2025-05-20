import { ModelNames, RabbitExchanges, RabbitRoutingKeys } from '@common/constants';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  BaseSearchPaginationQuery,
  DynamicLink,
  IDynamicLinkModel,
  ISearchResponseData,
  IUserSegmentModel,
  ResponsePayload,
  RpcResponse,
  UserSegment,
  addMaintainOrderStages,
  addPaginationStages,
} from '@instapets-backend/common';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { errorManager } from '@notifications/admin/shared';
import { PipelineStage, Types } from 'mongoose';
import { getDynamicLinksFilterPipeline, getUserSegmentsFilterPipeline } from './helpers/filters-pipeline.helper';

@Injectable()
export class FiltersService {
  constructor(
    @Inject(ModelNames.USER_SEGMENT) private readonly userSegmentModel: IUserSegmentModel,
    @Inject(ModelNames.DYNAMIC_LINK) private readonly dynamicLinkModel: IDynamicLinkModel,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async getUserSegmentFilterOptions(
    adminId: string,
    query: BaseSearchPaginationQuery,
  ): Promise<ResponsePayload<UserSegment>> {
    const { limit, page, search } = query;

    if (search) {
      return this.getSearchedUserSegmentFilterOptions(query);
    }

    const matchStage: PipelineStage[] = [
      {
        $match: {
          isArchived: false,
        },
      },
    ];

    const [userSegments, [{ total = 0 } = {}]] = await Promise.all([
      this.userSegmentModel.aggregate([
        ...matchStage,
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ limit, page }),
        ...getUserSegmentsFilterPipeline(),
      ]),
      this.userSegmentModel.aggregate([...matchStage]).count('total'),
    ]);

    return {
      data: userSegments,
      total,
      limit,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  private async getSearchedUserSegmentFilterOptions({
    page,
    limit,
    search,
  }: BaseSearchPaginationQuery): Promise<ResponsePayload<UserSegment>> {
    const payload: BaseSearchPaginationQuery = {
      page,
      limit,
      search,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_USER_SEGMENTS_SEARCH_FILTER_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.userSegmentModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getUserSegmentsFilterPipeline(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getDynamicLinksFilterOptions(
    adminId: string,
    query: BaseSearchPaginationQuery,
  ): Promise<ResponsePayload<DynamicLink>> {
    const { limit, page, search } = query;

    if (search) {
      return this.getSearchedDynamicLinksFilterOptions(query);
    }

    const matchStage: PipelineStage[] = [
      {
        $match: {
          isArchived: false,
        },
      },
    ];

    const [dynamicLinks, [{ total = 0 } = {}]] = await Promise.all([
      this.dynamicLinkModel.aggregate([
        ...matchStage,
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ limit, page }),
        ...getDynamicLinksFilterPipeline(),
      ]),
      this.dynamicLinkModel.aggregate([...matchStage]).count('total'),
    ]);

    return {
      data: dynamicLinks,
      total,
      limit,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  private async getSearchedDynamicLinksFilterOptions({
    page,
    limit,
    search,
  }: BaseSearchPaginationQuery): Promise<ResponsePayload<DynamicLink>> {
    const payload: BaseSearchPaginationQuery = {
      page,
      limit,
      search,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_DYNAMIC_LINKS_SEARCH_FILTER_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.dynamicLinkModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getDynamicLinksFilterPipeline(),
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
