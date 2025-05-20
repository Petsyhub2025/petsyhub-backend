import { BaseSearchPaginationQuery } from '@common/dtos';

export class FollowedPetsUserRpcPayload extends BaseSearchPaginationQuery {
  userId: string;
  excludePetId?: string;
  targetUserId?: string;
}
