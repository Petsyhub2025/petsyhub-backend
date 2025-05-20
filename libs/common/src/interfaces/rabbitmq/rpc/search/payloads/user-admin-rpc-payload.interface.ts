import { BaseSearchPaginationQuery } from '@common/dtos';
import { UserRoleEnum } from '@common/schemas/mongoose/user/user.enum';

export enum UserAdminSortByEnum {
  JOIN_DATE = 'createdAt',
  TOTAL_PETS = 'totalPets',
}

export enum UserAdminSortOrderEnum {
  ASC = 1,
  DESC = -1,
}

export class UserAdminRpcPayload extends BaseSearchPaginationQuery {
  joinDateFrom?: string;
  joinDateTo?: string;
  role?: UserRoleEnum;
  countryId?: string;
  cityId?: string;
  sortBy?: UserAdminSortByEnum;
  sortOrder?: UserAdminSortOrderEnum;
}
