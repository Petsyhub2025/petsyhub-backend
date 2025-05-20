import { WsCustomError } from '@common/classes/ws';
import { ErrorType } from '@common/enums';
import { AppConfig } from '@common/modules/env-config/services/app-config';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

@Injectable()
export class WsUserJwtVerifyGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly appConfig: AppConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const socket = context.switchToWs();

    const client = socket.getClient() as Socket;

    const { bearer: handshakeAuthToken } = client.handshake.auth as { bearer: string };
    const headerToken = client.handshake.headers?.authorization?.split(' ')?.[1];
    const token = handshakeAuthToken || headerToken;

    if (token) {
      try {
        const decoded = this.jwtService.decode(token);
        client.handshake.auth.persona = decoded;
        return true;
      } catch (error) {
        throw new WsException(
          new WsCustomError({
            localizedMessage: {
              en: 'Invalid token',
              ar: 'رمز غير صحيح',
            },
            errorType: ErrorType.UNAUTHORIZED,
          }),
        );
      }
    }

    throw new WsException(
      new WsCustomError({
        localizedMessage: {
          en: 'No token provided',
          ar: 'لم يتم توفير رمز تحقيق',
        },
        errorType: ErrorType.UNAUTHORIZED,
      }),
    );
  }
}
