import { BaseSearchPaginationQuery } from '@common/dtos';

export class UserFollowersRpcPayload extends BaseSearchPaginationQuery {
  recent: boolean;
  userId: string;
  targetUserId?: string;
}
