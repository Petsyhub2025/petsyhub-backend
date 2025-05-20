import { CustomError } from '@common/classes/custom-error.class';
import { API_VERSION_GUARD_METADATA_KEY, VERSIONING_REGEX } from '@common/constants';
import { ErrorType } from '@common/enums';
import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
import { BadRequestException, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class ApiVersionGuard {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Do nothing if this is a RabbitMQ event
    if (isRabbitContext(context)) {
      return true;
    }

    const noApiVersion = this.reflector.get<boolean>(API_VERSION_GUARD_METADATA_KEY, context.getHandler());

    if (noApiVersion) {
      return true;
    }

    const req = context.switchToHttp().getRequest();

    const version = req?.headers?.['x-api-version'];

    if (!version || typeof version !== 'string' || !VERSIONING_REGEX.test(version)) {
      throw new BadRequestException(
        new CustomError({
          localizedMessage: {
            en: 'Invalid API version',
            ar: 'إصدار API غير صالح',
          },
          errorType: ErrorType.WRONG_INPUT,
          event: 'INVALID_API_VERSION',
        }),
      );
    }

    return true;
  }
}
