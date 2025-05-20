import { SERVICE_PROVIDER_PERMISSION_GUARD_METADATA_KEY } from '@common/constants';
import { ServiceProviderPermissionGuardMetadata } from '@common/interfaces/metadata';
import { SetMetadata } from '@nestjs/common';

export const ServiceProviderPermission = (...permissions: ServiceProviderPermissionGuardMetadata[]): MethodDecorator =>
  SetMetadata(SERVICE_PROVIDER_PERMISSION_GUARD_METADATA_KEY, permissions);
