import { ErrorType } from '@common/enums';

export interface ICustomWsError {
  localizedMessage: {
    en: string;
    ar: string;
  };
  errorType?: ErrorType;
  eventName?: string;
  error?: any;
}
