import { CustomError } from '@instapets-backend/common';

export const errorManager = {
  SEARCH_FAILED: (msg: string) => {
    return new CustomError({
      localizedMessage: {
        en: msg,
        ar: msg,
      },
      event: 'SEARCH_FAILED',
    });
  },
  FILE_EXTENSION_MISSING: new CustomError({
    localizedMessage: {
      en: 'File extension is missing',
      ar: 'مطلوب امتداد الملف',
    },
    event: 'FILE_EXTENSION_REQUIRED',
  }),
  LINKED_ENTITY_HAS_NO_LINKED_MEDIA: new CustomError({
    localizedMessage: {
      en: 'Linked entity has a wrong identifier or no linked media',
      ar: 'الكيان المرتبط به معرف خاطئ أو لا يحتوي على وسائط مرتبطة',
    },
    event: 'LINKED_ENTITY_HAS_NO_LINKED_MEDIA',
  }),
  DYNAMIC_LINK_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Dynamic link not found',
      ar: 'الرابط الديناميكي غير موجود',
    },
    event: 'DYNAMIC_LINK_NOT_FOUND',
  }),
  USE_LINKED_MEDIA_NOT_PROVIDED: new CustomError({
    localizedMessage: {
      en: "useLinkedMedia must be provided when editing a dynamic link's linked properties or preview media",
      ar: 'يجب تقديم useLinkedMedia عند تحرير خصائص رابط ديناميكي مرتبط أو وسائط معاينة',
    },
    event: 'USE_LINKED_MEDIA_NOT_PROVIDED',
  }),
  DYNAMIC_LINK_TITLE_ALREADY_EXISTS: new CustomError({
    localizedMessage: {
      en: 'Dynamic link title already exists',
      ar: 'عنوان الرابط الديناميكي موجود بالفعل',
    },
    event: 'DYNAMIC_LINK_TITLE_ALREADY_EXISTS',
  }),
  MODEL_TYPE_NOT_SUPPORTED: new CustomError({
    localizedMessage: {
      en: 'Model type not supported',
      ar: 'نوع النموذج غير مدعوم',
    },
    event: 'MODEL_TYPE_NOT_SUPPORTED',
  }),
  DYNAMIC_LINK_IS_BEING_USED_BY_ACTIVE_USER_PUSH_NOTIFICATION: new CustomError({
    localizedMessage: {
      en: 'Dynamic link is being used by an active user push notification',
      ar: 'يتم استخدام الرابط الديناميكي من قبل إشعار دفع مستخدم نشط',
    },
    event: 'DYNAMIC_LINK_IS_BEING_USED_BY_ACTIVE_USER_PUSH_NOTIFICATION',
  }),
  USER_SEGMENT_ALREADY_EXISTS: new CustomError({
    localizedMessage: {
      en: 'User segment already exists',
      ar: 'قطاع المستخدم موجود بالفعل',
    },
    event: 'USER_SEGMENT_ALREADY_EXISTS',
  }),
  COUNTRY_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Country not found',
      ar: 'البلد غير موجود',
    },
    event: 'COUNTRY_NOT_FOUND',
  }),
  CITY_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'City not found',
      ar: 'المدينة غير موجودة',
    },
    event: 'CITY_NOT_FOUND',
  }),
  AREA_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Area not found',
      ar: 'المنطقة غير موجودة',
    },
    event: 'AREA_NOT_FOUND',
  }),
  PET_TYPE_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Pet type not found',
      ar: 'نوع الحيوان الأليف غير موجود',
    },
    event: 'PET_TYPE_NOT_FOUND',
  }),
  USER_SEGMENT_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'User segment not found',
      ar: 'قطاع المستخدم غير موجود',
    },
    event: 'USER_SEGMENT_NOT_FOUND',
  }),
  USER_SEGMENT_IS_BEING_USED_BY_ACTIVE_USER_PUSH_NOTIFICATION: new CustomError({
    localizedMessage: {
      en: 'User segment is being used by an active user push notification',
      ar: 'يتم استخدام قطاع المستخدم من قبل إشعار دفع مستخدم نشط',
    },
    event: 'USER_SEGMENT_IS_BEING_USED_BY_ACTIVE_USER_PUSH_NOTIFICATION',
  }),
  WRONG_VERSION_TYPE: new CustomError({
    localizedMessage: {
      en: 'Wrong version type',
      ar: 'نوع الإصدار خاطئ',
    },
    event: 'WRONG_VERSION_TYPE',
  }),
  COUNTRY_MUST_BE_PROVIDED: new CustomError({
    localizedMessage: {
      en: 'Country must be provided',
      ar: 'يجب تقديم البلد',
    },
    event: 'COUNTRY_MUST_BE_PROVIDED',
  }),
  CITY_MUST_BE_PROVIDED: new CustomError({
    localizedMessage: {
      en: 'City must be provided',
      ar: 'يجب تقديم المدينة',
    },
    event: 'CITY_MUST_BE_PROVIDED',
  }),
  USER_PUSH_NOTIFICATION_ALREADY_EXISTS: new CustomError({
    localizedMessage: {
      en: 'User push notification already exists',
      ar: 'إشعار دفع المستخدم موجود بالفعل',
    },
    event: 'USER_PUSH_NOTIFICATION_ALREADY_EXISTS',
  }),
  USER_PUSH_NOTIFICATION_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'User push notification not found',
      ar: 'إشعار دفع المستخدم غير موجود',
    },
    event: 'USER_PUSH_NOTIFICATION_NOT_FOUND',
  }),
  CANNOT_UPDATE_NON_SCHEDULED_USER_PUSH_NOTIFICATION: new CustomError({
    localizedMessage: {
      en: 'Cannot update non-scheduled user push notification',
      ar: 'لا يمكن تحديث إشعار دفع المستخدم غير المجدول',
    },
    event: 'CANNOT_UPDATE_NON_SCHEDULED_USER_PUSH_NOTIFICATION',
  }),
  CANNOT_CANCEL_NON_SCHEDULED_USER_PUSH_NOTIFICATION: new CustomError({
    localizedMessage: {
      en: 'Cannot cancel non-scheduled user push notification',
      ar: 'لا يمكن إلغاء إشعار دفع المستخدم غير المجدول',
    },
    event: 'CANNOT_CANCEL_NON_SCHEDULED_USER_PUSH_NOTIFICATION',
  }),
  CANNOT_UPDATE_INCLUDE_ALL_USERS_AND_USER_SEGMENTS: new CustomError({
    localizedMessage: {
      en: 'Cannot update includeAllUsers and userSegments at the same time',
      ar: 'لا يمكن تحديث includeAllUsers و userSegments في نفس الوقت',
    },
    event: 'CANNOT_UPDATE_INCLUDE_ALL_USERS_AND_USER_SEGMENTS',
  }),
  USER_SEGMENT_MUST_HAVE_ATLEAST_ONE_FIELD: new CustomError({
    localizedMessage: {
      en: 'User segment must have atleast one field',
      ar: 'يجب أن يحتوي قطاع المستخدم على حقل واحد على الأقل',
    },
    event: 'USER_SEGMENT_MUST_HAVE_ATLEAST_ONE_FIELD',
  }),
  CANNOT_UPDATE_USER_SEGMENT_USED_BY_SENT_USER_PUSH_NOTIFICATION: new CustomError({
    localizedMessage: {
      en: 'Cannot update user segment used by sent user push notification',
      ar: 'لا يمكن تحديث قطاع المستخدم المستخدم في إشعار دفع المستخدم المرسل',
    },
    event: 'CANNOT_UPDATE_USER_SEGMENT_USED_BY_SENT_USER_PUSH_NOTIFICATION',
  }),
  CANNOT_UPDATE_DYNAMIC_LINK_USED_BY_SENT_USER_PUSH_NOTIFICATION: new CustomError({
    localizedMessage: {
      en: 'Cannot update dynamic link used by sent user push notification',
      ar: 'لا يمكن تحديث الرابط الديناميكي المستخدم في إشعار دفع المستخدم المرسل',
    },
    event: 'CANNOT_UPDATE_DYNAMIC_LINK_USED_BY_SENT_USER_PUSH_NOTIFICATION',
  }),
  CANNOT_ARCHIVE_DYNAMIC_LINK_USED_BY_SCHEDULED_USER_PUSH_NOTIFICATION: function (pushNotificationsCount: number) {
    return new CustomError({
      localizedMessage: {
        en: `Cannot archive dynamic link used scheduled user push notification(s). ${pushNotificationsCount} scheduled user push notification(s) are using this dynamic link.`,
        ar: `لا يمكن أرشفة الرابط الديناميكي المستخدم في إشعار دفع المستخدم المجدول. يستخدم ${pushNotificationsCount} إشعار دفع مستخدم مجدول هذا الرابط الديناميكي.`,
      },
      event: 'CANNOT_ARCHIVE_DYNAMIC_LINK_USED_BY_SCHEDULED_USER_PUSH_NOTIFICATION',
    });
  },
  CANNOT_ARCHIVE_USER_SEGMENT_USED_BY_SCHEDULED_USER_PUSH_NOTIFICATION: function (pushNotificationsCount: number) {
    return new CustomError({
      localizedMessage: {
        en: `Cannot archive user segment used scheduled user push notification(s). ${pushNotificationsCount} scheduled user push notification(s) are using this user segment.`,
        ar: `لا يمكن أرشفة قطاع المستخدم المستخدم في إشعار دفع المستخدم المجدول. يستخدم ${pushNotificationsCount} إشعار دفع مستخدم مجدول هذا القطاع المستخدم.`,
      },
      event: 'CANNOT_ARCHIVE_USER_SEGMENT_USED_BY_SCHEDULED_USER_PUSH_NOTIFICATION',
    });
  },
  FAILED_TO_GET_DYNAMIC_LINK_ANALYTICS: new CustomError({
    localizedMessage: {
      en: 'Failed to get dynamic link analytics',
      ar: 'فشل الحصول على تحليلات الرابط الديناميكي',
    },
    event: 'FAILED_TO_GET_DYNAMIC_LINK_ANALYTICS',
  }),
  PET_TYPE_DUPLICATED: new CustomError({
    localizedMessage: {
      en: 'Pet type duplicated',
      ar: 'نوع الحيوان الأليف مكرر',
    },
    event: 'PET_TYPE_DUPLICATED',
  }),
  CITY_DUPLICATED: new CustomError({
    localizedMessage: {
      en: 'City duplicated',
      ar: 'المدينة مكررة',
    },
    event: 'CITY_DUPLICATED',
  }),
  AREA_DUPLICATED: new CustomError({
    localizedMessage: {
      en: 'Area duplicated',
      ar: 'المنطقة مكررة',
    },
    event: 'AREA_DUPLICATED',
  }),
  COUNTRY_DUPLICATED: new CustomError({
    localizedMessage: {
      en: 'Country duplicated',
      ar: 'البلد مكرر',
    },
    event: 'COUNTRY_DUPLICATED',
  }),
};
