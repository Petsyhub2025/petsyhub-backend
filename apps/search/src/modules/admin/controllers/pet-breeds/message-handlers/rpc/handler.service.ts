import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';
import {
  EsModelNames,
  ISearchResponseData,
  PetBreedAdminRpcPayload,
  PetBreedEsFieldsEnum,
  PetBreedEsSaytFieldsEnum,
  RpcResponse,
} from '@instapets-backend/common';

@Injectable()
export class PetBreedRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getPetBreedSearchData({
    page,
    limit,
    search,
    petTypeId,
  }: PetBreedAdminRpcPayload): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.PET_BREED,
        filters: [
          ...(petTypeId
            ? [
                {
                  term: {
                    type: petTypeId,
                  },
                },
              ]
            : []),
        ],
        query: search,
        searchableFields: [PetBreedEsFieldsEnum.NameEn, PetBreedEsFieldsEnum.NameAr],
        saytFields: [PetBreedEsSaytFieldsEnum.NameEn, PetBreedEsSaytFieldsEnum.NameAr],
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
