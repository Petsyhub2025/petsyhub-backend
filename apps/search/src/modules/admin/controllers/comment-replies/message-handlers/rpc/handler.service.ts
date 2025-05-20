import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';
import {
  CommentReplyAdminRpcPayload,
  CommentReplyEsFieldsEnum,
  CommentReplyEsSaytFieldsEnum,
  EsModelNames,
  ISearchResponseData,
  RpcResponse,
} from '@instapets-backend/common';

@Injectable()
export class CommentRepliesRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getCommentRepliesSearchData({
    page,
    limit,
    search,
    authorUserId,
    postId,
    replyOn,
  }: CommentReplyAdminRpcPayload): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.COMMENT_REPLY,
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
          ...(replyOn
            ? [
                {
                  term: {
                    replyOn: replyOn,
                  },
                },
              ]
            : []),
        ],
        query: search,
        searchableFields: [
          `${CommentReplyEsFieldsEnum.AuthorUserFullName}^2`,
          CommentReplyEsFieldsEnum.AuthorUserUsername,
        ],
        saytFields: [
          `${CommentReplyEsSaytFieldsEnum.AuthorUserFullName}^2`,
          CommentReplyEsSaytFieldsEnum.AuthorUserUsername,
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
