import { CustomError } from '@common/classes/custom-error.class';
import { ModelNames } from '@common/constants';
import { ErrorType } from '@common/enums';
import { ServiceProviderJwtPersona } from '@common/interfaces/jwt-persona';
import { IBrandMembershipModel } from '@common/schemas/mongoose/brand-membership/brand-membership.type';
import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Types } from 'mongoose';

@Injectable()
export class BrandOwnerGuard implements CanActivate {
  constructor(@Inject(ModelNames.BRAND_MEMBERSHIP) private brandMembershipModel: IBrandMembershipModel) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Do nothing if this is a RabbitMQ event
    if (isRabbitContext(context)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    const serviceProvider = <ServiceProviderJwtPersona>request.persona;

    const brandId = request.params?.brandId || request.query?.brandId || request.body?.brand;

    const isServiceProviderBrandOwner = await this.isBrandOwner(serviceProvider._id.toString(), brandId.toString());
    if (!isServiceProviderBrandOwner) {
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
}
