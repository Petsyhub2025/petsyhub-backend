import {
  BranchAccessResourcesEnum,
  BranchAccessResourceOperationsEnum,
} from '@common/schemas/mongoose/branch-access-control/branch-access-permissions';

export interface ServiceProviderPermissionGuardMetadata {
  resource: BranchAccessResourcesEnum;
  operation: BranchAccessResourceOperationsEnum;
  paramKey?: string;
}
