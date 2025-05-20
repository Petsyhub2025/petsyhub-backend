import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';
import {
  CommentAdminRpcPayload,
  CommentEsFieldsEnum,
  CommentEsSaytFieldsEnum,
  EsModelNames,
  ISearchResponseData,
  RpcResponse,
} from '@instapets-backend/common';

@Injectable()
export class CommentsRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getCommentsSearchData({
    page,
    limit,
    search,
    authorUserId,
    postId,
  }: CommentAdminRpcPayload): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.COMMENT,
        filters: [
          ...(authorUserId
            ? [
                {
                  term: {
                    'authorUser._id': authorUserId,
                  },
                },
              ]
            : []),
          ...(postId
            ? [
                {
                  term: {
                    post: postId,
                  },
                },
              ]
            : []),
        ],
        query: search,
        searchableFields: [
          `${CommentEsFieldsEnum.AuthorUserFullName}^2`,
          CommentEsFieldsEnum.AuthorUserUsername,
          `${CommentEsFieldsEnum.Body}^2`,
        ],
        saytFields: [
          `${CommentEsSaytFieldsEnum.AuthorUserFullName}^2`,
          CommentEsSaytFieldsEnum.AuthorUserUsername,
          `${CommentEsSaytFieldsEnum.Body}^2`,
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
