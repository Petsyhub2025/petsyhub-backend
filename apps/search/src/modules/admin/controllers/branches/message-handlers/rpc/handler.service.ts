import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';
import {
  EsModelNames,
  ISearchResponseData,
  RpcResponse,
  BranchRpcPayload,
  BranchesEsFieldsEnum,
  BranchesEsSaytFieldsEnum,
} from '@instapets-backend/common';

@Injectable()
export class BranchRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async BranchesSearchData({
    page,
    limit,
    search,
    cityId,
    countryId,
    brandId,
    status,
    areaId,
  }: BranchRpcPayload): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.BASE_BRANCH,
        filters: [
          ...(cityId
            ? [
                {
                  term: {
                    city: cityId,
                  },
                },
              ]
            : []),
          ...(countryId
            ? [
                {
                  term: {
                    country: countryId,
                  },
                },
              ]
            : []),
          ...(areaId
            ? [
                {
                  term: {
                    area: areaId,
                  },
                },
              ]
            : []),
          ...(brandId
            ? [
                {
                  term: {
                    brand: brandId,
                  },
                },
              ]
            : []),
          ...(status
            ? [
                {
                  term: {
                    status: status,
                  },
                },
              ]
            : []),
        ],
        query: search,
        searchableFields: [BranchesEsFieldsEnum.Name],
        saytFields: [BranchesEsSaytFieldsEnum.Name],
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
