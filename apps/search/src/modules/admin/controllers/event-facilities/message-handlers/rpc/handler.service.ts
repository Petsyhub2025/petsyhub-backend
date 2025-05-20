import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';
import {
  BaseSearchPaginationQuery,
  EsModelNames,
  EventFacilitiesEsFieldsEnum,
  EventFacilitiesEsSaytFieldsEnum,
  ISearchResponseData,
  RpcResponse,
} from '@instapets-backend/common';

@Injectable()
export class EventFacilitiesRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getEventFacilitiesSearchData({
    page,
    limit,
    search,
  }: BaseSearchPaginationQuery): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.EVENT_FACILITY,
        query: search,
        searchableFields: [EventFacilitiesEsFieldsEnum.NameEn, EventFacilitiesEsFieldsEnum.NameAr],
        saytFields: [EventFacilitiesEsSaytFieldsEnum.NameEn, EventFacilitiesEsSaytFieldsEnum.NameAr],
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
