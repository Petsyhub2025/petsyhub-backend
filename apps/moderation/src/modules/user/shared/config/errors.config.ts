import { CustomError, ErrorType } from '@instapets-backend/common';

export const errorManager = {
  USER_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'User not found',
      ar: 'المستخدم غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'USER_NOT_FOUND',
  }),
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
