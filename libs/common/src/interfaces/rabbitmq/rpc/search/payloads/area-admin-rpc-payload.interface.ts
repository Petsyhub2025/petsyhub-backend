import { BaseSearchPaginationQuery } from '@common/dtos';

export class AreaAdminRpcPayload extends BaseSearchPaginationQuery {
  cityId?: string;
}
