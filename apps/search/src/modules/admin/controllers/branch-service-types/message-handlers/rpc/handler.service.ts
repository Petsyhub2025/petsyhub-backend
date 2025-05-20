import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';
import {
  BaseSearchPaginationQuery,
  BranchServiceTypeEsFieldsEnum,
  BranchServiceTypeEsSaytFieldsEnum,
  EsModelNames,
  ISearchResponseData,
  RpcResponse,
} from '@instapets-backend/common';

@Injectable()
export class BranchServiceTypesRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getBranchServiceTypesSearchData({
    page,
    limit,
    search,
  }: BaseSearchPaginationQuery): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.BRANCH_SERVICE_TYPE,
        query: search,
        searchableFields: [BranchServiceTypeEsFieldsEnum.NameEn, BranchServiceTypeEsFieldsEnum.NameAr],
        saytFields: [BranchServiceTypeEsSaytFieldsEnum.NameEn, BranchServiceTypeEsSaytFieldsEnum.NameAr],
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
