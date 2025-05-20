import {
  BaseSearchPaginationQuery,
  EsModelNames,
  ISearchResponseData,
  RpcResponse,
  UserSegmentEsFieldsEnum,
  UserSegmentEsSaytFieldsEnum,
  UserSegmentsAdminRpcPayload,
} from '@instapets-backend/common';
import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';

@Injectable()
export class UserSegmentsRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getUserSegmentsSearchData(payload: UserSegmentsAdminRpcPayload): Promise<RpcResponse<ISearchResponseData>> {
    const { page, limit, search, isArchived } = payload;

    const searches = await this.elasticSearchHelperService.matchQuery({
      index: EsModelNames.USER_SEGMENT,
      query: search,
      searchableFields: [`${UserSegmentEsFieldsEnum.title}`],
      saytFields: [`${UserSegmentEsSaytFieldsEnum.title}`],
      page,
      limit,
      accurateCount: true,
      filters: [
        {
          term: {
            isArchived: isArchived ? true : false,
          },
        },
      ],
    });

    const total = searches?.total;
    const totalValue = typeof total === 'number' ? total : total?.value || 0;
    const _ids = searches?.hits ? searches.hits.map((value) => value._id) : [];

    return RpcResponse.success({
      _ids,
      limit,
      page,
      total: totalValue,
      pages: Math.ceil(totalValue / limit),
    });
  }

  async getUserSegmentsSearchFilterData(payload: BaseSearchPaginationQuery): Promise<RpcResponse<ISearchResponseData>> {
    const { page, limit, search } = payload;

    const searches = await this.elasticSearchHelperService.matchQuery({
      index: EsModelNames.USER_SEGMENT,
      query: search,
      searchableFields: [`${UserSegmentEsFieldsEnum.title}`],
      saytFields: [`${UserSegmentEsSaytFieldsEnum.title}`],
      page,
      limit,
      accurateCount: true,
      filters: [
        {
          term: {
            isArchived: false,
          },
        },
      ],
    });

    const total = searches?.total;
    const totalValue = typeof total === 'number' ? total : total?.value || 0;
    const _ids = searches?.hits ? searches.hits.map((value) => value._id) : [];

    return RpcResponse.success({
      _ids,
      limit,
      page,
      total: totalValue,
      pages: Math.ceil(totalValue / limit),
    });
  }
}
