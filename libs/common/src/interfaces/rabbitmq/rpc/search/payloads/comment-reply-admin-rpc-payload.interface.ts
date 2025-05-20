import { BaseSearchPaginationQuery } from '@common/dtos';

export class CommentReplyAdminRpcPayload extends BaseSearchPaginationQuery {
  authorUserId?: string;
  replyOn?: string;
  postId?: string;
}
