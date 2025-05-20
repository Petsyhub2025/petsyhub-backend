import { BaseSearchPaginationQuery } from '@common/dtos';

export class UserFollowingRpcPayload extends BaseSearchPaginationQuery {
  userId: string;
  targetUserId?: string;
}
