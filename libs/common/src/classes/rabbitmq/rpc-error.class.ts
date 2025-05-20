import { IBaseMessageError } from './base-message-error.class';

export interface IRpcError extends IBaseMessageError {}

export class RpcError extends Error implements IRpcError {
  message: string;
  stack?: string;
  error?: any;
  details?: any;

  constructor({ message, stack, error, details }: IRpcError) {
    super();
    this.name = 'RpcError';
    this.message = message;
    this.stack = stack;
    this.error = error;
    this.details = details;
  }
}
