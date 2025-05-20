import { CustomError } from '@common/classes/custom-error.class';
import { JWT_GUARD_METADATA_KEY } from '@common/constants';
import { ErrorType } from '@common/enums';
import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class JwtDecodeGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Do nothing if this is a RabbitMQ event
    if (isRabbitContext(context)) {
      return true;
    }

    const noBearer = this.reflector.get<boolean>(JWT_GUARD_METADATA_KEY, context.getHandler());

    if (noBearer) {
      return true;
    }

    const req = context.switchToHttp().getRequest();

    const token = req?.headers?.authorization?.split(' ')[1];

    if (token) {
      try {
        const decoded = this.jwtService.decode(token);
        req.persona = decoded;
        return true;
      } catch (error) {
        throw new UnauthorizedException(
          new CustomError({
            localizedMessage: {
              en: 'Invalid token',
              ar: 'رمز غير صحيح',
            },
            errorType: ErrorType.UNAUTHORIZED,
            event: 'UNAUTHORIZED',
          }),
        );
      }
    }

    throw new UnauthorizedException(
      new CustomError({
        localizedMessage: {
          en: 'No token provided',
          ar: 'لم يتم توفير رمز تحقيق',
        },
        errorType: ErrorType.UNAUTHORIZED,
        event: 'UNAUTHORIZED',
      }),
    );
  }
}
