import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { CustomLoggerService } from '../services/logger';
import { CustomResponse } from '@common/classes/custom-response.class';
import { redactSensitiveData } from '@common/helpers/redact-sensitive-data.helper';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: CustomLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler<CustomResponse>): Observable<any> {
    // Do nothing if this is a RabbitMQ event
    if (isRabbitContext(context)) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const persona = request.persona;

    return next.handle().pipe(
      tap<CustomResponse>((res) => {
        if (request.method === 'GET' || request.method === 'HEAD') return;

        if (
          request.url.includes('authentication/user/authentication') ||
          request.url.includes('authentication/admin/authentication')
        )
          return;

        const logMessage = this.logger.generateLogMessage(request, res.statusCode);

        redactSensitiveData(request.body);
        redactSensitiveData(request.query);

        this.logger.log(logMessage, {
          request: { headers: request.headers, body: request.body, query: request.query, params: request.params },
          response: res,
          persona: { ...persona, role: this.logger.getRole(persona) },
          http: {
            method: request.method,
            url: request.url,
            statusCode: res.statusCode,
          },
        });
      }),
    );
  }
}
