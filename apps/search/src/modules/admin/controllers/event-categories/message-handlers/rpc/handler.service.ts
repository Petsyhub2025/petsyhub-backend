import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';
import {
  BaseSearchPaginationQuery,
  EsModelNames,
  EventCategoriesEsFieldsEnum,
  EventCategoriesEsSaytFieldsEnum,
  ISearchResponseData,
  RpcResponse,
} from '@instapets-backend/common';

@Injectable()
export class EventCategoriesRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getEventCategoriesSearchData({
    page,
    limit,
    search,
  }: BaseSearchPaginationQuery): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.EVENT_CATEGORY,
        query: search,
        searchableFields: [EventCategoriesEsFieldsEnum.NameEn, EventCategoriesEsFieldsEnum.NameAr],
        saytFields: [EventCategoriesEsSaytFieldsEnum.NameEn, EventCategoriesEsSaytFieldsEnum.NameAr],
        page,
        limit,
        accurateCount: true,
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
}
