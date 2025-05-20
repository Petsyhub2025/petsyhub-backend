import {
  BaseSearchPaginationQuery,
  DynamicLinkEsFieldsEnum,
  DynamicLinkEsSaytFieldsEnum,
  DynamicLinksAdminRpcPayload,
  EsModelNames,
  ISearchResponseData,
  RpcResponse,
} from '@instapets-backend/common';
import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';

@Injectable()
export class DynamicLinksRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getDynamicLinksSearchData(payload: DynamicLinksAdminRpcPayload): Promise<RpcResponse<ISearchResponseData>> {
    const { page, limit, search, isArchived, type } = payload;

    const searches = await this.elasticSearchHelperService.matchQuery({
      index: EsModelNames.DYNAMIC_LINK,
      query: search,
      searchableFields: [`${DynamicLinkEsFieldsEnum.title}`],
      saytFields: [`${DynamicLinkEsSaytFieldsEnum.title}`],
      page,
      limit,
      accurateCount: true,
      filters: [
        {
          term: {
            isArchived: isArchived ? true : false,
          },
        },
        ...(type && type.length > 0
          ? [
              {
                terms: {
                  'linkedTo.modelType': type,
                },
              },
            ]
          : []),
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

  async getDynamicLinksSearchFilterData(payload: BaseSearchPaginationQuery): Promise<RpcResponse<ISearchResponseData>> {
    const { page, limit, search } = payload;

    const searches = await this.elasticSearchHelperService.matchQuery({
      index: EsModelNames.DYNAMIC_LINK,
      query: search,
      searchableFields: [`${DynamicLinkEsFieldsEnum.title}`],
      saytFields: [`${DynamicLinkEsSaytFieldsEnum.title}`],
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
