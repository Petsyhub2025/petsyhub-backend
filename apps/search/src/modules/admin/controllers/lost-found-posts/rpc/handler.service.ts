import {
  BaseSearchPaginationQuery,
  EsModelNames,
  FoundPostAdminRpcPayload,
  FoundPostAdminSortOrderEnum,
  FoundPostEsFieldsEnum,
  FoundPostEsSaytFieldsEnum,
  ISearchResponseData,
  LostPostAdminRpcPayload,
  LostPostAdminSortOrderEnum,
  LostPostEsFieldsEnum,
  LostPostEsSaytFieldsEnum,
  RpcResponse,
} from '@instapets-backend/common';
import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';

@Injectable()
export class LostFoundPostsRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getLostPostsSearchData({
    page,
    limit,
    search,
    authorUserId,
    cityId,
    countryId,
    isFound,
    petId,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
  }: LostPostAdminRpcPayload): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.LOST_POST,
        filters: [
          ...(dateFrom || dateTo
            ? [
                {
                  range: {
                    createdAt: {
                      ...(dateFrom && { gte: dateFrom }),
                      ...(dateTo && { lte: dateTo }),
                    },
                  },
                },
              ]
            : []),
          ...(petId
            ? [
                {
                  term: {
                    'pet._id': petId,
                  },
                },
              ]
            : []),
          ...(authorUserId
            ? [
                {
                  term: {
                    'authorUser._id': authorUserId,
                  },
                },
              ]
            : []),
          ...(cityId
            ? [
                {
                  term: {
                    'locationData.city': cityId,
                  },
                },
              ]
            : []),
          ...(countryId
            ? [
                {
                  term: {
                    'locationData.country': countryId,
                  },
                },
              ]
            : []),
          ...(isFound
            ? [
                {
                  term: {
                    isFound,
                  },
                },
              ]
            : []),
        ],
        query: search,
        searchableFields: [
          `${LostPostEsFieldsEnum.AuthorUserFullName}^2`,
          `${LostPostEsFieldsEnum.PetName}^2`,
          LostPostEsFieldsEnum.AuthorUserUsername,
          `${LostPostEsFieldsEnum.description}^3`,
        ],
        saytFields: [
          `${LostPostEsSaytFieldsEnum.AuthorUserFullName}^2`,
          `${LostPostEsSaytFieldsEnum.PetName}^2`,
          LostPostEsSaytFieldsEnum.AuthorUserUsername,
          `${LostPostEsSaytFieldsEnum.description}^3`,
        ],
        sort: [
          {
            [sortBy]: {
              order: sortOrder === LostPostAdminSortOrderEnum.ASC ? 'asc' : 'desc',
            },
          },
          {
            _score: {
              order: 'desc',
            },
          },
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

  async getLostPostsSearchFilterData({
    page,
    limit,
    search,
  }: BaseSearchPaginationQuery): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.LOST_POST,
        query: search,
        searchableFields: [
          `${LostPostEsFieldsEnum.AuthorUserFullName}^2`,
          `${LostPostEsFieldsEnum.PetName}^2`,
          LostPostEsFieldsEnum.AuthorUserUsername,
          `${LostPostEsFieldsEnum.description}^3`,
        ],
        saytFields: [
          `${LostPostEsSaytFieldsEnum.AuthorUserFullName}^2`,
          `${LostPostEsSaytFieldsEnum.PetName}^2`,
          LostPostEsSaytFieldsEnum.AuthorUserUsername,
          `${LostPostEsSaytFieldsEnum.description}^3`,
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

  async getFoundPostsSearchData({
    page,
    limit,
    search,
    authorUserId,
    cityId,
    countryId,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
  }: FoundPostAdminRpcPayload): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.FOUND_POST,
        filters: [
          ...(dateFrom || dateTo
            ? [
                {
                  range: {
                    createdAt: {
                      ...(dateFrom && { gte: dateFrom }),
                      ...(dateTo && { lte: dateTo }),
                    },
                  },
                },
              ]
            : []),
          ...(authorUserId
            ? [
                {
                  term: {
                    'authorUser._id': authorUserId,
                  },
                },
              ]
            : []),
          ...(cityId
            ? [
                {
                  term: {
                    'locationData.city': cityId,
                  },
                },
              ]
            : []),
          ...(countryId
            ? [
                {
                  term: {
                    'locationData.country': countryId,
                  },
                },
              ]
            : []),
        ],
        query: search,
        searchableFields: [
          `${FoundPostEsFieldsEnum.AuthorUserFullName}^2`,
          FoundPostEsFieldsEnum.AuthorUserUsername,
          `${FoundPostEsFieldsEnum.description}^2`,
        ],
        saytFields: [
          `${FoundPostEsSaytFieldsEnum.AuthorUserFullName}^2`,
          FoundPostEsSaytFieldsEnum.AuthorUserUsername,
          `${FoundPostEsSaytFieldsEnum.description}^2`,
        ],
        sort: [
          {
            [sortBy]: {
              order: sortOrder === FoundPostAdminSortOrderEnum.ASC ? 'asc' : 'desc',
            },
          },
          {
            _score: {
              order: 'desc',
            },
          },
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

  async getFoundPostsSearchFilterData({
    page,
    limit,
    search,
  }: BaseSearchPaginationQuery): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.FOUND_POST,
        query: search,
        searchableFields: [
          `${FoundPostEsFieldsEnum.AuthorUserFullName}^2`,
          FoundPostEsFieldsEnum.AuthorUserUsername,
          `${FoundPostEsFieldsEnum.description}^2`,
        ],
        saytFields: [
          `${FoundPostEsSaytFieldsEnum.AuthorUserFullName}^2`,
          FoundPostEsSaytFieldsEnum.AuthorUserUsername,
          `${FoundPostEsSaytFieldsEnum.description}^2`,
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
