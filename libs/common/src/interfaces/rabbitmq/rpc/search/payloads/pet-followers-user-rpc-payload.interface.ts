import { BaseSearchPaginationQuery } from '@common/dtos';

export class PetFollowersRpcPayload extends BaseSearchPaginationQuery {
  recent: boolean;
}
