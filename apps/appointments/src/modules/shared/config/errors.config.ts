import { CustomError, ErrorType } from '@instapets-backend/common';

export const errorManager = {
  SEARCH_FAILED: (msg: string) => {
    return new CustomError({
      localizedMessage: {
        en: msg,
        ar: msg,
      },
      errorType: ErrorType.WRONG_REQUEST,
      event: 'SEARCH_FAILED',
    });
  },
  APPOINTMENT_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Appointment not found',
      ar: 'الميعاد غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'APPOINTMENT_NOT_FOUND',
  }),
  APPOINTMENT_NOT_AUTHORIZED: new CustomError({
    localizedMessage: {
      en: 'Appointment not authorized',
      ar: 'الميعاد غير مصرح لك',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'APPOINTMENT_NOT_AUTHORIZED',
  }),
  APPOINTMENT_STATUS_NOT_VALID: new CustomError({
    localizedMessage: {
      en: 'Appointment status not valid for this operation',
      ar: 'حالة الميعاد غير صالحة لهذه العملية',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'APPOINTMENT_STATUS_NOT_VALID',
  }),
};
