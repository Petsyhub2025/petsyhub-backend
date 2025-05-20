import { BaseSearchPaginationQuery } from '@common/dtos';

export class CityAdminRpcPayload extends BaseSearchPaginationQuery {
  countryId?: string;
}
