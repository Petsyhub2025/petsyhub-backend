import { BaseSearchPaginationQuery } from '@common/dtos';

export enum LostPostAdminSortByEnum {
  CREATED_DATE = 'createdAt',
}

export enum LostPostAdminSortOrderEnum {
  ASC = 1,
  DESC = -1,
}
export class LostPostAdminRpcPayload extends BaseSearchPaginationQuery {
  authorUserId?: string;
  petId?: string;
  cityId?: string;
  countryId?: string;
  isFound?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: LostPostAdminSortByEnum;
  sortOrder?: LostPostAdminSortOrderEnum;
}
