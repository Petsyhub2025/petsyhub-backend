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
  SERVICE_PROVIDER_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Service Provider not found',
      ar: 'مقدم الخدمة غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'SERVICE_PROVIDER_NOT_FOUND',
  }),
  ACCOUNT_ALREADY_COMPLETED: new CustomError({
    localizedMessage: {
      en: 'You already completed your profile',
      ar: 'لقد أكملت الملف الشخصي بالفعل',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'ACCOUNT_ALREADY_COMPLETED',
  }),
  EMAIL_ALREADY_EXIST: new CustomError({
    localizedMessage: {
      en: 'Email already exist',
      ar: 'البريد الاليكتروني مسجل من قبل',
    },
    errorType: ErrorType.CONFLICT,
    event: 'EMAIL_ALREADY_EXIST',
  }),
  PHONE_NUMBER_ALREADY_EXIST: new CustomError({
    localizedMessage: {
      en: 'Phone number already exist',
      ar: 'رقم الهاتف مسجل من قبل',
    },
    errorType: ErrorType.CONFLICT,
    event: 'PHONE_NUMBER_ALREADY_EXIST',
  }),
};
