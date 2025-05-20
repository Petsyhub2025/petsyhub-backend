import { BaseSearchPaginationQuery } from '@common/dtos';

export class PetAdminRpcPayload extends BaseSearchPaginationQuery {
  userId?: string;
  petBreedId?: string;
  petTypeId?: string;
}
