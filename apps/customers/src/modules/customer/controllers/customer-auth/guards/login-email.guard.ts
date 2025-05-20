import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { handleAuthGuardRequest } from '@instapets-backend/common';

@Injectable()
export class LoginEmailGuard extends AuthGuard('customer-login-email') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext, status?: any) {
    return handleAuthGuardRequest(err, user, info, context, status);
  }
}
