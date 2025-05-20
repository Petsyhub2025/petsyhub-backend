import { BaseSearchPaginationQuery } from '@common/dtos';

export class AdminAdminRpcPayload extends BaseSearchPaginationQuery {
  roleId?: string;
}
