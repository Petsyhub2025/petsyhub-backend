import { IBaseMessageError } from './base-message-error.class';

interface IListenerError extends IBaseMessageError {}

export class ListenerError extends Error implements IListenerError {
  message: string;
  stack?: string;
  error?: any;
  details?: any;

  constructor({ message, stack, error, details }: IListenerError) {
    super();
    this.name = 'ListenerError';
    this.message = message;
    this.stack = stack;
    this.error = error;
    this.details = details;
  }
}
