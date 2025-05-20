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
  TOPIC_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Topic not found',
      ar: 'موضوع غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'TOPIC_NOT_FOUND',
  }),
  TOPIC_NAME_ALREADY_EXISTS: new CustomError({
    localizedMessage: {
      en: 'Topic name already exists',
      ar: 'اسم الموضوع مسجل من قبل',
    },
    errorType: ErrorType.CONFLICT,
    event: 'TOPIC_NAME_ALREADY_EXISTS',
  }),
};
