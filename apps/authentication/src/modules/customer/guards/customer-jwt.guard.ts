import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { handleAuthGuardRequest } from '@instapets-backend/common';

@Injectable()
export class CustomerJwtAuthGuard extends AuthGuard('customer-jwt') {
  handleRequest<TCustomer = any>(
    err: any,
    customer: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TCustomer {
    return handleAuthGuardRequest(err, customer, info, context, status);
  }
}
