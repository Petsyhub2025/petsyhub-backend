import { CustomError, ErrorType } from '@instapets-backend/common';

export const errorManager = {
  USER_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'User not found',
      ar: 'لم يتم العثور على المستخدم',
    },
    event: 'USER_NOT_FOUND',
  }),
  PET_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Pet not found',
      ar: 'لم يتم العثور على الحيوان الأليف',
    },
    event: 'PET_NOT_FOUND',
    errorType: ErrorType.NOT_FOUND,
  }),
  NO_PETS_FOUND: new CustomError({
    localizedMessage: {
      en: 'No pets found',
      ar: 'لم يتم العثور على حيوانات أليفة',
    },
    event: 'NO_PETS_FOUND',
    errorType: ErrorType.NOT_FOUND,
  }),
  PET_TYPE_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Pet type not found',
      ar: 'لم يتم العثور على نوع الحيوان الأليف',
    },
    event: 'PET_TYPE_NOT_FOUND',
    errorType: ErrorType.NOT_FOUND,
  }),
  PET_BREED_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Pet breed not found',
      ar: 'لم يتم العثور على سلالة الحيوان الأليف',
    },
    event: 'PET_BREED_NOT_FOUND',
    errorType: ErrorType.NOT_FOUND,
  }),
  PET_BREED_NOT_SAME_TYPE: new CustomError({
    localizedMessage: {
      en: 'Pet breed not same type',
      ar: 'سلالة الحيوان الأليف ليست من نفس النوع',
    },
    event: 'PET_BREED_NOT_SAME_TYPE',
    errorType: ErrorType.WRONG_REQUEST,
  }),
  INVALID_LOCATION: new CustomError({
    localizedMessage: {
      en: 'Invalid location or location unsupported',
      ar: 'موقع غير صالح أو غير مدعوم',
    },
    event: 'INVALID_LOCATION',
    errorType: ErrorType.WRONG_REQUEST,
  }),
  LOST_POST_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Lost post not found',
      ar: 'لم يتم العثور على منشور مفقود',
    },
    event: 'LOST_POST_NOT_FOUND',
    errorType: ErrorType.NOT_FOUND,
  }),
  DUPLICATE_LOST_POST: new CustomError({
    localizedMessage: {
      en: 'Duplicate post',
      ar: 'منشور مكرر',
    },
    event: 'DUPLICATE_LOST_POST',
    errorType: ErrorType.WRONG_REQUEST,
  }),
  FILE_EXTENSION_MISSING: new CustomError({
    localizedMessage: {
      en: 'File extension is missing',
      ar: 'مطلوب امتداد الملف',
    },
    event: 'FILE_EXTENSION_REQUIRED',
    errorType: ErrorType.WRONG_INPUT,
  }),
  FOUND_POST_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Lost post not found',
      ar: 'لم يتم العثور على منشور مفقود',
    },
    event: 'LOST_POST_NOT_FOUND',
    errorType: ErrorType.NOT_FOUND,
  }),
  CITY_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'City not found',
      ar: 'المدينة غير موجودة',
    },
    event: 'CITY_NOT_FOUND',
  }),
  SEARCH_FAILED: (msg: string) => {
    return new CustomError({
      localizedMessage: {
        en: msg,
        ar: msg,
      },
      event: 'SEARCH_FAILED',
    });
  },
  MATCH_REQUEST_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Match request not found',
      ar: 'لم يتم العثور على طلب المطابقة',
    },
    event: 'MATCH_REQUEST_NOT_FOUND',
  }),
  MATCH_ALREADY_ACCEPTED: new CustomError({
    localizedMessage: {
      en: 'Match already accepted',
      ar: 'تم قبول المطابقة بالفعل',
    },
    event: 'MATCH_ALREADY_ACCEPTED',
  }),
  CANNOT_MATCH_WITH_OWN_PET: new CustomError({
    localizedMessage: {
      en: 'Cannot match with own pet',
      ar: 'لا يمكن المطابقة مع الحيوان الأليف الخاص بك',
    },
    event: 'CANNOT_MATCH_WITH_OWN_PET',
  }),
};
