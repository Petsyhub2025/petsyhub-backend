import { ErrorType } from '@common/enums';
import { ICustomWsError } from './ws-custom-error.interface';

export class WsCustomError implements ICustomWsError {
  localizedMessage: {
    en: string;
    ar: string;
  };
  errorType?: ErrorType;
  eventName?: string;
  error?: any;

  constructor(error: ICustomWsError) {
    this.localizedMessage = error.localizedMessage;
    this.errorType = error.errorType;
    this.eventName = error.eventName;
    this.error = error.error;
  }
}
