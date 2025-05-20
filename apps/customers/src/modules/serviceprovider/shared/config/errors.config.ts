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

  CUSTOMER_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Customer not found',
      ar: 'المستخدم غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'CUSTOMER_NOT_FOUND',
  }),
};
