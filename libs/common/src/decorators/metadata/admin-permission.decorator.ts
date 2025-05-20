import { ADMIN_PERMISSION_GUARD_METADATA_KEY } from '@common/constants';
import { AdminPermissionGuardMetadata } from '@common/interfaces/metadata';
import { SetMetadata } from '@nestjs/common';

export const AdminPermission = (...permissions: AdminPermissionGuardMetadata[]): MethodDecorator =>
  SetMetadata(ADMIN_PERMISSION_GUARD_METADATA_KEY, permissions);
