import { EnvironmentEnum, ErrorType } from '@common/enums';
import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';
import { CustomError } from '@common/classes/custom-error.class';
import { redactSensitiveData } from '@common/helpers/redact-sensitive-data.helper';
import { AppConfig } from '@common/modules/env-config/services/app-config';
import { CustomLoggerService } from '@common/modules/common/services/logger';

@Catch()
export class ExceptionFilter extends BaseExceptionFilter {
  constructor(
    private appConfig: AppConfig,
    private logger: CustomLoggerService,
  ) {
    super();
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const contextType = host.getType<'http' | 'rmq'>();

    // Do nothing if this is a RabbitMQ event
    if (contextType === 'rmq') {
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let exceptionBody = exception.getResponse?.() as CustomError;

    if ((exceptionBody as Record<string, any>)?.message === `Cannot ${request.method} ${request.url}`) {
      exceptionBody = new CustomError({
        localizedMessage: {
          en: 'Route Not Found',
          ar: 'المسار غير موجود',
        },
        event: 'NOT_FOUND',
      });
    }

    if (!(exceptionBody instanceof CustomError)) {
      exceptionBody = new CustomError({
        localizedMessage: {
          en: 'Internal Server Error',
          ar: 'خطأ في الخادم',
        },
        event: 'INTERNAL_SERVER_ERROR',
        ...(this.appConfig.NODE_ENV !== EnvironmentEnum.PROD
          ? { error: { exception, message: exception?.message } }
          : {}),
      });
    }

    const statusCode = exception?.getStatus?.() ?? 500;

    const logMessage = this.logger.generateLogMessage(request, statusCode);

    redactSensitiveData(request.body);
    redactSensitiveData(request.query);

    this.logger.error(logMessage + ` - error: ${exception.message} ${exception.stack}`, {
      request: { headers: request.headers, body: request.body, query: request.query, params: request.params },
      persona: { ...request.persona, role: this.logger.getRole(request.persona) },
      exception: exceptionBody,
      http: {
        method: request.method,
        url: request.url,
        statusCode: statusCode,
      },
    });

    response.status(statusCode).json(exceptionBody);
  }
}
