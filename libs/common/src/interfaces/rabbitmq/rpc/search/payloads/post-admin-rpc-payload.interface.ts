import { BaseSearchPaginationQuery } from '@common/dtos';

export class PostAdminRpcPayload extends BaseSearchPaginationQuery {
  authorUserId?: string;
  authorPetId?: string;
}
