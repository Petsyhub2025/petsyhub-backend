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
  COMMENT_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Comment not found',
      ar: 'التعليق غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'COMMENT_NOT_FOUND',
  }),
  COMMENT_REPLY_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Comment reply not found',
      ar: 'رد التعليق غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'COMMENT_REPLY_NOT_FOUND',
  }),
};
