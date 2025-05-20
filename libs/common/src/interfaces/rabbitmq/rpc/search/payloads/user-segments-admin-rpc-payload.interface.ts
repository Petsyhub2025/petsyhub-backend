import { BaseSearchPaginationQuery } from '@common/dtos';

export class UserSegmentsAdminRpcPayload extends BaseSearchPaginationQuery {
  isArchived?: boolean;
}
