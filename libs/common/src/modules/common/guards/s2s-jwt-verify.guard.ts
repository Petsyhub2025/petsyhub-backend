import { CustomError } from '@common/classes/custom-error.class';
import { ErrorType } from '@common/enums';
import { AppConfig } from '@common/modules/env-config/services/app-config';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class VerifyS2SJwtToken implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly appConfig: AppConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();

    const token = req?.headers?.authorization?.split(' ')[1];

    if (token) {
      try {
        const decoded = this.jwtService.verify(token, {
          secret: this.appConfig.S2S_JWT_SECRET,
        });

        if (!decoded) throw new Error();

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
