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
  EVENT_CATEGORY_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Event category not found',
      ar: 'نوع الخدمة غير موجود',
    },
    errorType: ErrorType.CONFLICT,
    event: 'EVENT_CATEGORY_NOT_FOUND',
  }),
  EVENT_CATEGORY_IN_USE_BY_EVENTS: new CustomError({
    localizedMessage: {
      en: 'Event category is in use by events',
      ar: 'نوع الخدمة قيد الاستخدام من قبل الفعاليات',
    },
    errorType: ErrorType.FORBIDDEN,
    event: 'EVENT_CATEGORY_IN_USE_BY_EVENTS',
  }),
  EVENT_FACILITY_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Event facility not found',
      ar: 'مرفق الفعالية غير موجود',
    },
    errorType: ErrorType.CONFLICT,
    event: 'EVENT_FACILITY_NOT_FOUND',
  }),
  EVENT_FACILITY_IN_USE_BY_EVENTS: new CustomError({
    localizedMessage: {
      en: 'Event facility is in use by events',
      ar: 'مرفق الفعالية قيد الاستخدام من قبل الفعاليات',
    },
    errorType: ErrorType.FORBIDDEN,
    event: 'EVENT_FACILITY_IN_USE_BY_EVENTS',
  }),
};
