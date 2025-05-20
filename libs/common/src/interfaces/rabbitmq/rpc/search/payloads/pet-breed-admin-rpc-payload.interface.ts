import { BaseSearchPaginationQuery } from '@common/dtos';

export class PetBreedAdminRpcPayload extends BaseSearchPaginationQuery {
  petTypeId?: string;
}
