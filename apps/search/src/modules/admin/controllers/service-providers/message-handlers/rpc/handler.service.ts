import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';
import {
  EsModelNames,
  ISearchResponseData,
  RpcResponse,
  ServiceProviderRpcPayload,
  ServiceProvidersEsFieldsEnum,
  ServiceProvidersEsSaytFieldsEnum,
} from '@instapets-backend/common';

@Injectable()
export class ServiceProviderRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getServiceProvidersSearchData({
    page,
    limit,
    search,
  }: ServiceProviderRpcPayload): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.SERVICE_PROVIDER,
        query: search,
        searchableFields: [`${ServiceProvidersEsFieldsEnum.fullName}^2`, ServiceProvidersEsFieldsEnum.email],
        saytFields: [`${ServiceProvidersEsSaytFieldsEnum.fullName}^2`, ServiceProvidersEsSaytFieldsEnum.email],
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
