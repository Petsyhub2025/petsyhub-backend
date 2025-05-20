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
  CITY_HAS_USERS: new CustomError({
    localizedMessage: {
      en: 'City has users',
      ar: 'المدينة لديها مستخدمين',
    },
    errorType: ErrorType.FORBIDDEN,
    event: 'CITY_HAS_USERS',
  }),
  COUNTRY_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Country not found',
      ar: 'الدولة غير موجودة',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'CITY_NOT_FOUND',
  }),
  CITY_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'City not found',
      ar: 'المدينة غير موجودة',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'CITY_NOT_FOUND',
  }),
  COUNTRY_ALREADY_EXISTS: new CustomError({
    localizedMessage: {
      en: 'Country already exists',
      ar: 'الدولة موجودة بالفعل',
    },
    errorType: ErrorType.CONFLICT,
    event: 'COUNTRY_ALREADY_EXISTS',
  }),
  COUNTRY_HAS_USERS: new CustomError({
    localizedMessage: {
      en: 'Country has users',
      ar: 'الدولة لديها مستخدمين',
    },
    errorType: ErrorType.FORBIDDEN,
    event: 'COUNTRY_HAS_USERS',
  }),
  AREA_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Area not found',
      ar: 'المنطقة غير موجودة',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'AREA_NOT_FOUND',
  }),
  AREA_HAS_USERS: new CustomError({
    localizedMessage: {
      en: 'Area has users',
      ar: 'المنطقة لديها مستخدمين',
    },
    errorType: ErrorType.FORBIDDEN,
    event: 'AREA_HAS_USERS',
  }),
  AREA_ALREADY_EXISTS: new CustomError({
    localizedMessage: {
      en: 'Area already exists',
      ar: 'المنطقة موجودة بالفعل',
    },
    errorType: ErrorType.CONFLICT,
    event: 'AREA_ALREADY_EXISTS',
  }),
};
