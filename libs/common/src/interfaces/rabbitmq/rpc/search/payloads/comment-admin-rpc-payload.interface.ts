import { BaseSearchPaginationQuery } from '@common/dtos';

export class CommentAdminRpcPayload extends BaseSearchPaginationQuery {
  authorUserId?: string;
  postId?: string;
}
