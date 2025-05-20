import { BaseSearchPaginationQuery } from '@common/dtos';

export enum FoundPostAdminSortByEnum {
  FOUND_DATE = 'createdAt',
}

export enum FoundPostAdminSortOrderEnum {
  ASC = 1,
  DESC = -1,
}
export class FoundPostAdminRpcPayload extends BaseSearchPaginationQuery {
  authorUserId?: string;
  cityId?: string;
  countryId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: FoundPostAdminSortByEnum;
  sortOrder?: FoundPostAdminSortOrderEnum;
}
