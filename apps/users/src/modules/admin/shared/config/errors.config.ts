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
  USER_NOT_ACTIVE: new CustomError({
    localizedMessage: {
      en: 'User not active',
      ar: 'المستخدم غير نشط',
    },
    errorType: ErrorType.INVALID,
    event: 'USER_NOT_ACTIVE',
  }),
  USER_NOT_SUSPENDED: new CustomError({
    localizedMessage: {
      en: 'User not suspended',
      ar: 'المستخدم غير موقوف',
    },
    errorType: ErrorType.INVALID,
    event: 'USER_NOT_SUSPENDED',
  }),
  USER_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'User not found',
      ar: 'المستخدم غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'USER_NOT_FOUND',
  }),
  COUNTRY_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Country not found',
      ar: 'الدولة غير موجودة',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'COUNTRY_NOT_FOUND',
  }),
  CITY_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'City not found',
      ar: 'المدينة غير موجودة',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'CITY_NOT_FOUND',
  }),
};
