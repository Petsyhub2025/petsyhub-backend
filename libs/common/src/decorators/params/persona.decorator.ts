import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Persona = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();

  return request.persona;
});
