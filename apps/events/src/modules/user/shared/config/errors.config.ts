import { CustomError, ErrorType } from '@instapets-backend/common';

export const errorManager = {
  EVENT_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Event not found',
      ar: 'الحدث غير موجود',
    },
    event: 'EVENT_NOT_FOUND',
  }),
  EVENT_CATEGORY_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Event category not found',
      ar: 'فئة الحدث غير موجودة',
    },
    event: 'EVENT_CATEGORY_NOT_FOUND',
  }),
  EVENT_FACILITY_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Event facility not found',
      ar: 'مرفق الحدث غير موجود',
    },
    event: 'EVENT_FACILITY_NOT_FOUND',
  }),
  PET_BREED_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Pet breed not found',
      ar: 'سلالة الحيوانات الأليفة غير موجودة',
    },
    event: 'PET_BREED_NOT_FOUND',
  }),
  PET_TYPE_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Pet type not found',
      ar: 'نوع الحيوانات الأليفة غير موجود',
    },
    event: 'PET_TYPE_NOT_FOUND',
  }),
  FILE_EXTENSION_MISSING: new CustomError({
    localizedMessage: {
      en: 'File extension missing',
      ar: 'امتداد الملف مفقود',
    },
    event: 'FILE_EXTENSION_MISSING',
  }),
  EVENT_NOT_CANCELLED: new CustomError({
    localizedMessage: {
      en: 'Event must be cancelled before it can be deleted',
      ar: 'يجب إلغاء الحدث قبل حذفه',
    },
    event: 'EVENT_NOT_CANCELLED',
  }),
  INVALID_LOCATION: new CustomError({
    localizedMessage: {
      en: 'Invalid location or location unsupported',
      ar: 'موقع غير صالح أو غير مدعوم',
    },
    event: 'INVALID_LOCATION',
  }),
  INVALID_DATE_RANGE: new CustomError({
    localizedMessage: {
      en: 'Invalid date range',
      ar: 'نطاق التاريخ غير صالح',
    },
    event: 'INVALID_DATE_RANGE',
  }),
  CITY_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'City not found',
      ar: 'المدينة غير موجودة',
    },
    event: 'CITY_NOT_FOUND',
  }),
  CANNOT_RSVP_CANCELLED_EVENT: new CustomError({
    localizedMessage: {
      en: 'Cannot RSVP to a cancelled event',
      ar: 'لا يمكن الاشتراك في حدث ملغى',
    },
    event: 'CANNOT_RSVP_CANCELLED_EVENT',
  }),
  EVENT_ALREADY_CANCELLED: new CustomError({
    localizedMessage: {
      en: 'Event is already cancelled',
      ar: 'تم إلغاء الحدث بالفعل',
    },
    event: 'EVENT_ALREADY_CANCELLED',
  }),
  CANNOT_UPDATE_CANCELLED_EVENT: new CustomError({
    localizedMessage: {
      en: 'Cannot update a cancelled event',
      ar: 'لا يمكن تحديث حدث ملغى',
    },
    event: 'CANNOT_UPDATE_CANCELLED_EVENT',
  }),
};
