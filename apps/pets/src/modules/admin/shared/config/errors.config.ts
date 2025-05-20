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
  PET_BREED_HAS_USERS: new CustomError({
    localizedMessage: {
      en: 'Pet breed has users',
      ar: 'سلالة الحيوان الأليف لديها مستخدمين',
    },
    errorType: ErrorType.FORBIDDEN,
    event: 'PET_BREED_HAS_USERS',
  }),
  PET_TYPE_HAS_USERS: new CustomError({
    localizedMessage: {
      en: 'Pet type has users',
      ar: 'نوع الحيوان الأليف لديه مستخدمين',
    },
    errorType: ErrorType.FORBIDDEN,
    event: 'PET_TYPE_HAS_USERS',
  }),
  PET_TYPE_ALREADY_EXISTS: new CustomError({
    localizedMessage: {
      en: 'Pet type already exists',
      ar: 'نوع الحيوان الأليف موجود بالفعل',
    },
    errorType: ErrorType.CONFLICT,
    event: 'PET_TYPE_ALREADY_EXISTS',
  }),
  PET_TYPE_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Pet type not found',
      ar: 'نوع الحيوان الأليف غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'PET_TYPE_NOT_FOUND',
  }),
  PET_BREED_ALREADY_EXISTS: new CustomError({
    localizedMessage: {
      en: 'Pet breed already exists',
      ar: 'سلالة الحيوان الأليف موجودة بالفعل',
    },
    errorType: ErrorType.CONFLICT,
    event: 'PET_BREED_ALREADY_EXISTS',
  }),
  PET_BREED_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Pet breed not found',
      ar: 'سلالة الحيوان الأليف غير موجودة',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'PET_BREED_NOT_FOUND',
  }),
  PET_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Pet not found',
      ar: 'لم يتم العثور على الحيوان الأليف',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'PET_NOT_FOUND',
  }),
  USER_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'User not found',
      ar: 'لم يتم العثور على المستخدم',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'USER_NOT_FOUND',
  }),
  LOST_POST_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Lost post not found',
      ar: 'لم يتم العثور على منشور مفقود',
    },
    event: 'LOST_POST_NOT_FOUND',
    errorType: ErrorType.NOT_FOUND,
  }),
  FOUND_POST_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Lost post not found',
      ar: 'لم يتم العثور على منشور مفقود',
    },
    event: 'LOST_POST_NOT_FOUND',
    errorType: ErrorType.NOT_FOUND,
  }),
};
