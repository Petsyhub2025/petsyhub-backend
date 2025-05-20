import { CustomError } from '@common/classes/custom-error.class';
import { ModelNames, SERVICE_PROVIDER_PERMISSION_GUARD_METADATA_KEY } from '@common/constants';
import { ErrorType } from '@common/enums';
import { ServiceProviderJwtPersona } from '@common/interfaces/jwt-persona';
import { ServiceProviderPermissionGuardMetadata } from '@common/interfaces/metadata';
import {
  BranchAccessControl,
  IBranchAccessControlModel,
} from '@common/schemas/mongoose/branch-access-control/branch-access-control.type';
import { BranchAccessPermissionOperations } from '@common/schemas/mongoose/branch-access-control/branch-access-permissions';
import { IBrandMembershipModel } from '@common/schemas/mongoose/brand-membership/brand-membership.type';
import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Types } from 'mongoose';

@Injectable()
export class ServiceProviderPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(ModelNames.BRAND_MEMBERSHIP) private brandMembershipModel: IBrandMembershipModel,
    @Inject(ModelNames.BRANCH_ACCESS_CONTROL) private branchAccessControlModel: IBranchAccessControlModel,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Do nothing if this is a RabbitMQ event
    if (isRabbitContext(context)) {
      return true;
    }

    const permissions = this.reflector.get<ServiceProviderPermissionGuardMetadata[]>(
      SERVICE_PROVIDER_PERMISSION_GUARD_METADATA_KEY,
      context.getHandler(),
    );

    if (!permissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    const serviceProvider = <ServiceProviderJwtPersona>request.persona;

    const brandId = request.query?.brandId || request.body?.brand || request.body?.brandId;

    const isServiceProviderBrandOwner = await this.isBrandOwner(serviceProvider._id.toString(), brandId.toString());
    if (isServiceProviderBrandOwner) {
      return true;
    }

    const hasBranchAccessControlPermission = await this.hasBranchAccessControlPermission(
      serviceProvider._id.toString(),
      permissions,
      request,
    );

    if (!hasBranchAccessControlPermission) {
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

  private async hasBranchAccessControlPermission(
    serviceProviderId: string,
    permissions: ServiceProviderPermissionGuardMetadata[],
    request: Request,
  ): Promise<boolean> {
    const branchId = request.query?.branchId || request.params?.branchId || request.body?.branchId;

    const serviceProviderBranchAccessControl = await this.getServiceProviderBranchAccessControl(
      serviceProviderId,
      branchId.toString(),
    );

    const hasPermission = permissions.every((permission) => {
      const resourcePermissions: BranchAccessPermissionOperations =
        serviceProviderBranchAccessControl.permissions[permission.resource] ||
        serviceProviderBranchAccessControl.permissions[request.params[permission.paramKey]];

      if (!resourcePermissions) return false;

      return resourcePermissions[permission.operation];
    });
    return hasPermission;
  }

  private async isBrandOwner(serviceProviderId: string, brandId: string) {
    const serviceProviderBrandMembership = await this.brandMembershipModel.findOne(
      {
        serviceProvider: new Types.ObjectId(serviceProviderId),
        brand: new Types.ObjectId(brandId),
      },
      {
        serviceProvider: 1,
        brand: 1,
        isBrandOwner: 1,
      },
    );

    if (!serviceProviderBrandMembership) {
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

    if (serviceProviderBrandMembership.isBrandOwner === true) {
      return true;
    }

    return false;
  }

  private async getServiceProviderBranchAccessControl(serviceProviderId: string, branchId: string) {
    const branchAccessControl = await this.branchAccessControlModel.findOne(
      {
        serviceProvider: new Types.ObjectId(serviceProviderId),
        branch: new Types.ObjectId(branchId),
      },
      {
        brand: 1,
        branch: 1,
        serviceProvider: 1,
        permissions: 1,
        role: 1,
        status: 1,
      },
    );

    if (!branchAccessControl) {
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

    return branchAccessControl;
  }
}
