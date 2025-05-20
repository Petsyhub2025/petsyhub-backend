import {
  BaseSearchPaginationQuery,
  EsModelNames,
  ISearchResponseData,
  RpcResponse,
  UserAdminRpcPayload,
  UserAdminSortOrderEnum,
  UserEsFieldsEnum,
  UserEsSaytFieldsEnum,
} from '@instapets-backend/common';
import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';

@Injectable()
export class UsersRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getUsersSearchData(payload: UserAdminRpcPayload): Promise<RpcResponse<ISearchResponseData>> {
    const { page, limit, search, cityId, countryId, joinDateFrom, joinDateTo, role, sortBy, sortOrder } = payload;

    const cityIdFilter = cityId ? [{ term: { city: cityId } }] : [];
    const countryIdFilter = countryId ? [{ term: { country: countryId } }] : [];
    const joinDateFilter =
      joinDateFrom || joinDateTo
        ? [
            {
              range: {
                createdAt: {
                  ...(joinDateFrom && { gte: joinDateFrom }),
                  ...(joinDateTo && { lte: joinDateTo }),
                },
              },
            },
          ]
        : [];
    const roleFilter = role ? [{ term: { role } }] : [];

    const searches = await this.elasticSearchHelperService.matchQuery({
      index: EsModelNames.USER,
      query: search,
      searchableFields: [`${UserEsFieldsEnum.FullName}^2`, UserEsFieldsEnum.Username],
      saytFields: [`${UserEsSaytFieldsEnum.FullName}^2`, UserEsSaytFieldsEnum.Username],
      page,
      limit,
      accurateCount: true,
      filters: [...cityIdFilter, ...countryIdFilter, ...joinDateFilter, ...roleFilter],
      sort: [
        {
          [sortBy]: {
            order: sortOrder === UserAdminSortOrderEnum.ASC ? 'asc' : 'desc',
          },
        },
        {
          _score: {
            order: 'desc',
          },
        },
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

  async getUsersSearchFilterData(payload: BaseSearchPaginationQuery): Promise<RpcResponse<ISearchResponseData>> {
    const { page, limit, search } = payload;

    const searches = await this.elasticSearchHelperService.matchQuery({
      index: EsModelNames.USER,
      query: search,
      searchableFields: [`${UserEsFieldsEnum.FullName}^2`, UserEsFieldsEnum.Username],
      saytFields: [`${UserEsSaytFieldsEnum.FullName}^2`, UserEsSaytFieldsEnum.Username],
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
