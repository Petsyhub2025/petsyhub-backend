import { CustomError, ErrorType } from '@instapets-backend/common';

export const errorManager = {
  POST_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Post not found',
      ar: 'المنشور غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'POST_NOT_FOUND',
  }),
  USER_MISMATCH_ERROR: new CustomError({
    localizedMessage: {
      en: 'User mismatch error',
      ar: 'خطأ في عدم تطابق المستخدم',
    },
    errorType: ErrorType.FORBIDDEN,
    event: 'USER_MISMATCH_ERROR',
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

  LIKE_ALREADY_EXISTS: new CustomError({
    localizedMessage: {
      en: 'Like already exists',
      ar: 'الإعجاب موجود بالفعل',
    },
    errorType: ErrorType.CONFLICT,
    event: 'LIKE_ALREADY_EXISTS',
  }),

  LIKE_DOES_NOT_EXIST: new CustomError({
    localizedMessage: {
      en: 'Like does not exist',
      ar: 'الإعجاب غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'LIKE_DOES_NOT_EXIST',
  }),
};
