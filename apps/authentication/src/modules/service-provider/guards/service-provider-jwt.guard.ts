import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { handleAuthGuardRequest } from '@instapets-backend/common';

@Injectable()
export class ServiceProviderJwtAuthGuard extends AuthGuard('service-provider-jwt') {
  handleRequest<TUser = any>(err: any, user: any, info: any, context: ExecutionContext, status?: any): TUser {
    return handleAuthGuardRequest(err, user, info, context, status);
  }
}
