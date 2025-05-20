import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';
import {
  AdminAdminRpcPayload,
  AdminEsFieldsEnum,
  AdminEsSaytFieldsEnum,
  EsModelNames,
  ISearchResponseData,
  RpcResponse,
} from '@instapets-backend/common';

@Injectable()
export class AdminsRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getAdminsSearchData({
    page,
    limit,
    search,
    roleId,
  }: AdminAdminRpcPayload): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.ADMIN,
        filters: [
          ...(roleId
            ? [
                {
                  term: {
                    'role._id': roleId,
                  },
                },
              ]
            : []),
        ],
        query: search,
        searchableFields: [`${AdminEsFieldsEnum.FullName}^2`, AdminEsFieldsEnum.email],
        saytFields: [`${AdminEsSaytFieldsEnum.FullName}^2`, AdminEsSaytFieldsEnum.email],
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
