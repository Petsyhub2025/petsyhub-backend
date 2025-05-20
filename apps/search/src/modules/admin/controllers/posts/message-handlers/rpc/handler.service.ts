import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';
import {
  BaseSearchPaginationQuery,
  EsModelNames,
  ISearchResponseData,
  PostAdminRpcPayload,
  PostEsFieldsEnum,
  PostEsSaytFieldsEnum,
  RpcResponse,
} from '@instapets-backend/common';

@Injectable()
export class PostsRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getPostsSearchData({
    page,
    limit,
    search,
    authorPetId,
    authorUserId,
  }: PostAdminRpcPayload): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.POST,
        filters: [
          ...(authorPetId
            ? [
                {
                  term: {
                    'authorPet._id': authorPetId,
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
        ],
        query: search,
        searchableFields: [
          `${PostEsFieldsEnum.AuthorPetName}^2`,
          PostEsFieldsEnum.AuthorUserUsername,
          `${PostEsFieldsEnum.AuthorUserFullName}^2`,
        ],
        saytFields: [
          `${PostEsSaytFieldsEnum.AuthorPetName}^2`,
          PostEsSaytFieldsEnum.AuthorUserUsername,
          `${PostEsSaytFieldsEnum.AuthorUserFullName}^2`,
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

  async getPostsSearchFilterData(payload: BaseSearchPaginationQuery): Promise<RpcResponse<ISearchResponseData>> {
    const { page, limit, search } = payload;

    const searches = await this.elasticSearchHelperService.matchQuery({
      index: EsModelNames.POST,
      query: search,
      searchableFields: [
        `${PostEsFieldsEnum.indexedId}^2`,
        `${PostEsFieldsEnum.AuthorPetName}^2`,
        PostEsFieldsEnum.AuthorUserUsername,
        `${PostEsFieldsEnum.AuthorUserFullName}^2`,
      ],
      saytFields: [
        `${PostEsSaytFieldsEnum.indexedId}^2`,
        `${PostEsSaytFieldsEnum.AuthorPetName}^2`,
        PostEsSaytFieldsEnum.AuthorUserUsername,
        `${PostEsSaytFieldsEnum.AuthorUserFullName}^2`,
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
