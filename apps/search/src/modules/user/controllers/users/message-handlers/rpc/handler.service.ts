import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';
import {
  BaseSearchPaginationQuery,
  EsModelNames,
  ISearchResponseData,
  RpcResponse,
  UserEsFieldsEnum,
  UserEsSaytFieldsEnum,
} from '@instapets-backend/common';

@Injectable()
export class UsersRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getUsersSearchData({
    page,
    limit,
    search,
  }: BaseSearchPaginationQuery): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.USER,
        filters: [
          {
            term: {
              isViewable: true,
            },
          },
        ],
        query: search,
        searchableFields: [`${UserEsFieldsEnum.FullName}^2`, UserEsFieldsEnum.Username],
        saytFields: [`${UserEsSaytFieldsEnum.FullName}^2`, UserEsSaytFieldsEnum.Username],
        page,
        limit,
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
