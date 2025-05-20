import { ErrorType } from '@common/enums';

export class CustomError {
  localizedMessage: {
    en: string;
    ar: string;
  };
  event: string;
  error?: any;

  constructor({
    localizedMessage,
    event,
    errorType,
    error,
  }: {
    localizedMessage: { en: string; ar: string };
    event: string;
    errorType?: ErrorType;
    error?: any;
  }) {
    this.localizedMessage = localizedMessage;
    this.event = event;
    this.error = error;
  }
}
