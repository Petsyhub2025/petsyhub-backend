import {
  BadGatewayException,
  Controller,
  Get,
  InternalServerErrorException,
  UnauthorizedException,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CustomError, ErrorType, IsPrivateAuthOrPublic, NoApiVersion } from '@instapets-backend/common';

@Controller({ path: 'auth-error', version: VERSION_NEUTRAL })
@ApiTags('public')
export class AuthErrorController {
  @NoApiVersion()
  @IsPrivateAuthOrPublic()
  @Get('error401')
  unAuthorizedError() {
    throw new UnauthorizedException(
      new CustomError({
        localizedMessage: {
          en: 'Unauthorized',
          ar: 'غير مصرح به هذا الإجراء',
        },
        errorType: ErrorType.UNAUTHORIZED,
        event: 'UNAUTHORIZED_EXCEPTION',
      }),
    );
  }

  @NoApiVersion()
  @IsPrivateAuthOrPublic()
  @Get('error500')
  internalServerError() {
    throw new InternalServerErrorException(
      new CustomError({
        localizedMessage: {
          en: 'Internal Server Error',
          ar: 'خطأ في الخادم',
        },
        errorType: ErrorType.UNKNOWN,
        event: 'INTERNAL_SERVER_ERROR',
      }),
    );
  }

  @NoApiVersion()
  @IsPrivateAuthOrPublic()
  @Get('error429')
  tooManyRequests() {
    throw new BadGatewayException(
      new CustomError({
        localizedMessage: {
          en: 'Too Many Requests',
          ar: 'طلبات كثيرة جدا',
        },
        errorType: ErrorType.UNKNOWN,
        event: 'TOO_MANY_REQUESTS',
      }),
    );
  }
}
