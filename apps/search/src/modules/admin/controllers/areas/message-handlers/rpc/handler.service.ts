import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';
import {
  AreaAdminRpcPayload,
  AreaEsFieldsEnum,
  AreaEsSaytFieldsEnum,
  EsModelNames,
  ISearchResponseData,
  RpcResponse,
} from '@instapets-backend/common';

@Injectable()
export class AreaRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getAreasSearchData({
    page,
    limit,
    search,
    cityId,
  }: AreaAdminRpcPayload): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.AREA,
        query: search,
        searchableFields: [AreaEsFieldsEnum.NameEn, AreaEsFieldsEnum.NameAr],
        saytFields: [AreaEsSaytFieldsEnum.NameEn, AreaEsSaytFieldsEnum.NameAr],
        page,
        limit,
        accurateCount: true,
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
}
