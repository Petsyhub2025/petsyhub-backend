import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';

export const WsPersona = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const socketClient = ctx.switchToWs().getClient() as Socket;

  return socketClient?.handshake?.auth?.persona;
});
