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
  POST_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Post not found',
      ar: 'المنشور غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'POST_NOT_FOUND',
  }),
  PET_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Pet not found',
      ar: 'الحيوان الأليف غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'PET_NOT_FOUND',
  }),
  USER_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'User not found',
      ar: 'المستخدم غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'USER_NOT_FOUND',
  }),
};
