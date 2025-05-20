import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';
import {
  CityAdminRpcPayload,
  CityEsFieldsEnum,
  CityEsSaytFieldsEnum,
  EsModelNames,
  ISearchResponseData,
  RpcResponse,
} from '@instapets-backend/common';

@Injectable()
export class CityRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getCitiesSearchData({
    page,
    limit,
    search,
    countryId,
  }: CityAdminRpcPayload): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.CITY,
        filters: [
          ...(countryId
            ? [
                {
                  term: {
                    country: countryId,
                  },
                },
              ]
            : []),
        ],
        query: search,
        searchableFields: [CityEsFieldsEnum.NameEn, CityEsFieldsEnum.NameAr],
        saytFields: [CityEsSaytFieldsEnum.NameEn, CityEsSaytFieldsEnum.NameAr],
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
