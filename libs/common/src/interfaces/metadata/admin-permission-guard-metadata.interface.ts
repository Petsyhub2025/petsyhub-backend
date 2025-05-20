import { VirtualAdminResourcesEnum } from '@common/enums';
import { AdminResourcesEnum, AdminResourceOperationsEnum } from '@common/schemas/mongoose/admin/admin-permissions';

export interface AdminPermissionGuardMetadata {
  resource: AdminResourcesEnum | VirtualAdminResourcesEnum;
  operation: AdminResourceOperationsEnum;
  paramKey?: string;
}
