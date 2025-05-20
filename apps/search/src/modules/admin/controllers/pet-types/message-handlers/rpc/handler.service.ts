import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';
import {
  BaseSearchPaginationQuery,
  EsModelNames,
  ISearchResponseData,
  PetTypeEsFieldsEnum,
  PetTypeEsSaytFieldsEnum,
  RpcResponse,
} from '@instapets-backend/common';

@Injectable()
export class PetTypesRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getPetTypesSearchData({
    page,
    limit,
    search,
  }: BaseSearchPaginationQuery): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.PET_TYPE,
        query: search,
        searchableFields: [PetTypeEsFieldsEnum.NameEn, PetTypeEsFieldsEnum.NameAr],
        saytFields: [PetTypeEsSaytFieldsEnum.NameEn, PetTypeEsSaytFieldsEnum.NameAr],
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
