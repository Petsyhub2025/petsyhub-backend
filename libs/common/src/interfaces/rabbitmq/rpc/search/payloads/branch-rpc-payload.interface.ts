import { BaseSearchPaginationQuery } from '@common/dtos';
import { BranchStatusEnum } from '@common/schemas/mongoose/branch/base-branch.enum';

export class BranchRpcPayload extends BaseSearchPaginationQuery {
  brandId: string;
  status: BranchStatusEnum;
  cityId: string;
  countryId: string;
  areaId: string;
}
