import { SocketEventsEnum } from '@common/enums';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { CustomLoggerService } from '../services/logger';
import { CustomResponse } from '@common/classes/custom-response.class';
import { redactWsSensitiveData } from '@common/helpers/redact-sensitive-data.helper';

@Injectable()
export class WsLoggingInterceptor implements NestInterceptor {
  constructor(private logger: CustomLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler<CustomResponse>): Observable<any> {
    const socket = context.switchToWs();

    if (!socket || !socket.getClient?.()) {
      this.logger.error('Unknown socket context detected', {
        context,
      });
      return;
    }

    const client = socket.getClient() as Socket;
    const data = socket.getData();
    const persona = client?.handshake?.auth?.persona;
    const event = socket.getPattern() ?? data?.event ?? 'UNKNOWN';

    if (event === SocketEventsEnum.SEND_MESSAGE || event === SocketEventsEnum.ROOM_MESSAGES) {
      return;
    }

    const logMessage = `${this.logger.getPersonaWithRole(persona)} - ${event}`;

    redactWsSensitiveData(data);

    this.logger.log(logMessage, {
      data,
      persona: { ...persona, role: this.logger.getRole(persona) },
    });

    return next.handle();
  }
}
