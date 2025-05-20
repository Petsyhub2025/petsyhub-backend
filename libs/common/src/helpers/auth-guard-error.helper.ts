import { CustomError } from '@common/classes/custom-error.class';
import { ErrorType } from '@common/enums';
import { ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';

export const handleAuthGuardRequest = <TUser = any>(
  err: any,
  user: any,
  info: any,
  context: ExecutionContext,
  status?: any,
): TUser => {
  if (err || !user) {
    const logger = new Logger('HandleAuthGuardRequest');
    logger.error(
      `${context.switchToHttp().getRequest().method} ${
        context.switchToHttp().getRequest().url
      } - error: ${err?.message}`,
      err?.stack,
    );
    throw new UnauthorizedException(
      (err?.response || err?.cause) instanceof CustomError
        ? err?.response || err?.cause
        : new CustomError({
            localizedMessage: {
              en: 'Unauthorized',
              ar: 'غير مصرح به هذا الإجراء',
            },
            errorType: ErrorType.UNAUTHORIZED,
            event: 'UNAUTHORIZED_EXCEPTION',
          }),
    );
  }
  return user;
};
