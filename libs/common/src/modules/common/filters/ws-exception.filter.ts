import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { CustomLoggerService } from '../services/logger';
import { Socket } from 'socket.io';
import { EnvironmentEnum, ErrorType, SocketEventsEnum } from '@common/enums';
import { WsCustomError } from '@common/classes/ws';
import { redactSensitiveData } from '@common/helpers/redact-sensitive-data.helper';
import { AppConfig } from '@common/modules/env-config/services/app-config';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  constructor(
    private appConfig: AppConfig,
    private logger: CustomLoggerService,
  ) {
    super();
  }

  catch(exception: WsException, host: ArgumentsHost) {
    const socket = host.switchToWs();

    if (!socket || !socket.getClient?.()) {
      this.logger.error('Unknown socket exception detected', {
        exception,
      });
      return;
    }

    const client = socket.getClient() as Socket;
    const data = socket.getData();

    let exceptionBody = exception?.getError?.() as WsCustomError;
    const event = exceptionBody?.eventName ?? socket.getPattern() ?? data?.event ?? 'UNKNOWN';

    if (!(exceptionBody instanceof WsCustomError)) {
      exceptionBody = new WsCustomError({
        localizedMessage: {
          en: 'Internal Server Error',
          ar: 'خطأ في الخادم',
        },
        errorType: ErrorType.UNKNOWN,
        ...(this.appConfig.NODE_ENV !== EnvironmentEnum.PROD ? { error: exception } : {}),
      });
    }

    redactSensitiveData(data);
    exceptionBody.eventName = event;

    const { persona } = client.handshake.auth;

    const logMessage = `${this.logger.getPersonaWithRole(persona)} - ${exceptionBody.eventName}`;

    this.logger.error(logMessage + ` - error: ${exception.message} ${exception.stack}`, {
      data,
      persona: { ...persona, role: this.logger.getRole(persona) },
      exception: exceptionBody,
    });

    client.emit(SocketEventsEnum.EXCEPTION, exceptionBody);
  }
}
