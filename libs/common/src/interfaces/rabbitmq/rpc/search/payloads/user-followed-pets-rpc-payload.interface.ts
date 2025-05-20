import { BaseSearchPaginationQuery } from '@common/dtos';

export class UserFollowedPetsRpcPayload extends BaseSearchPaginationQuery {
  recent: boolean;
  petId?: string;
}
