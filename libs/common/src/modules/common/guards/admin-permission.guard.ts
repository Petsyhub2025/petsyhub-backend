import { CustomError } from '@common/classes/custom-error.class';
import { ADMIN_PERMISSION_GUARD_METADATA_KEY } from '@common/constants';
import { ErrorType, VirtualAdminResourcesEnum } from '@common/enums';
import { AdminJwtPersona } from '@common/interfaces/jwt-persona';
import { AdminPermissionGuardMetadata } from '@common/interfaces/metadata';
import {
  AdminResourcesEnum,
  AdminPermissions,
  AdminPermissionOperations,
} from '@common/schemas/mongoose/admin/admin-permissions';
import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class AdminPermissionGuard implements CanActivate {
  private virtualResourcesToExistingResourceMap = {
    [VirtualAdminResourcesEnum.REPLIES]: AdminResourcesEnum.COMMENTS,
  };

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Do nothing if this is a RabbitMQ event
    if (isRabbitContext(context)) {
      return true;
    }

    const permissions = this.reflector.get<AdminPermissionGuardMetadata[]>(
      ADMIN_PERMISSION_GUARD_METADATA_KEY,
      context.getHandler(),
    );

    if (!permissions) {
      return true;
    }

    const isInvalid = permissions.some(
      (permission) => permission.paramKey && permission.resource !== VirtualAdminResourcesEnum.UNKNOWN,
    );

    if (isInvalid) throw new Error('Invalid permission guard metadata');

    const request = context.switchToHttp().getRequest<Request>();

    const admin = <AdminJwtPersona>request.persona;

    const hasPermission = await this.hasPermission(permissions, admin.permissions, request);

    if (!hasPermission) {
      throw new ForbiddenException(
        new CustomError({
          localizedMessage: {
            en: 'You are not allowed to perform this action',
            ar: 'لا يمكنك تنفيذ هذا الإجراء',
          },
          event: 'FORBIDDEN',
          errorType: ErrorType.UNAUTHORIZED,
        }),
      );
    }

    return true;
  }

  private async hasPermission(
    permissions: AdminPermissionGuardMetadata[],
    adminPermissions: AdminPermissions,
    request: Request,
  ): Promise<boolean> {
    const hasPermission = permissions.every((permission) => {
      const resourcePermissions: AdminPermissionOperations =
        adminPermissions[permission.resource] ||
        adminPermissions[request.params[permission.paramKey]] ||
        adminPermissions[this.virtualResourcesToExistingResourceMap[permission.resource]];

      if (!resourcePermissions) return false;

      return resourcePermissions[permission.operation];
    });

    return hasPermission;
  }
}
