import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';
import {
  BaseSearchPaginationQuery,
  EsModelNames,
  ISearchResponseData,
  PetAdminRpcPayload,
  PetEsFieldsEnum,
  PetEsSaytFieldsEnum,
  RpcResponse,
} from '@instapets-backend/common';

@Injectable()
export class PetsRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getPetsSearchData({
    page,
    limit,
    search,
    petBreedId,
    petTypeId,
    userId,
  }: PetAdminRpcPayload): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.PET,
        filters: [
          ...(userId
            ? [
                {
                  term: {
                    'user._id': userId,
                  },
                },
              ]
            : []),
          ...(petBreedId
            ? [
                {
                  term: {
                    breed: petBreedId,
                  },
                },
              ]
            : []),
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
        searchableFields: [
          `${PetEsFieldsEnum.Name}^2`,
          PetEsFieldsEnum.UserUsername,
          `${PetEsFieldsEnum.UserFullName}^2`,
        ],
        saytFields: [
          `${PetEsSaytFieldsEnum.Name}^2`,
          PetEsSaytFieldsEnum.UserUsername,
          `${PetEsSaytFieldsEnum.UserFullName}^2`,
        ],
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

  async getPetsSearchFilterData({
    page,
    limit,
    search,
  }: BaseSearchPaginationQuery): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.PET,
        query: search,
        searchableFields: [
          `${PetEsFieldsEnum.Name}^2`,
          PetEsFieldsEnum.UserUsername,
          `${PetEsFieldsEnum.UserFullName}^2`,
        ],
        saytFields: [
          `${PetEsSaytFieldsEnum.Name}^2`,
          PetEsSaytFieldsEnum.UserUsername,
          `${PetEsSaytFieldsEnum.UserFullName}^2`,
        ],
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
