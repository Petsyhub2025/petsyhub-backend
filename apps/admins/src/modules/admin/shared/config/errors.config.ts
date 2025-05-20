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
  ADMIN_CANNOT_DELETE_ADMIN_WITH_ADMIN_PERMISSIONS: new CustomError({
    localizedMessage: {
      en: 'Admin cannot delete admin with admin permissions',
      ar: 'لا يمكن للمشرف حذف مشرف مع أذونات المشرف',
    },
    errorType: ErrorType.UNAUTHORIZED,
    event: 'ADMIN_CANNOT_DELETE_ADMIN_WITH_ADMIN_PERMISSIONS',
  }),
  ADMIN_CANNOT_DELETE_SELF: new CustomError({
    localizedMessage: {
      en: 'Admin cannot delete self',
      ar: 'لا يمكن للمشرف حذف نفسه',
    },
    errorType: ErrorType.CONFLICT,
    event: 'ADMIN_CANNOT_DELETE_SELF',
  }),
  ADMIN_DOES_NOT_HAVE_PERMISSION_TO_SUBSCRIBE_TO_TOPIC: new CustomError({
    localizedMessage: {
      en: 'Admin does not have permission to subscribe to topic',
      ar: 'المشرف ليس لديه إذن للاشتراك في الموضوع',
    },
    errorType: ErrorType.UNAUTHORIZED,
    event: 'ADMIN_DOES_NOT_HAVE_PERMISSION_TO_SUBSCRIBE_TO_TOPIC',
  }),
  VERSION_ALREADY_DEPRECATED: new CustomError({
    localizedMessage: {
      en: 'Version already deprecated',
      ar: 'الإصدار متقادم بالفعل',
    },
    errorType: ErrorType.CONFLICT,
    event: 'VERSION_ALREADY_DEPRECATED',
  }),
  VERSION_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Version not found',
      ar: 'الإصدار غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'VERSION_NOT_FOUND',
  }),
  WRONG_VERSION_RANGE: new CustomError({
    localizedMessage: {
      en: 'Wrong version range',
      ar: 'نطاق الإصدار خاطئ',
    },
    errorType: ErrorType.WRONG_REQUEST,
    event: 'WRONG_VERSION_RANGE',
  }),
  WRONG_VERSION_TYPE: new CustomError({
    localizedMessage: {
      en: 'Wrong version type',
      ar: 'نوع الإصدار خاطئ',
    },
    errorType: ErrorType.WRONG_REQUEST,
    event: 'WRONG_VERSION_TYPE',
  }),
  ADMIN_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Admin not found',
      ar: 'المستخدم غير موجود',
    },
    event: 'ADMIN_NOT_FOUND',
    errorType: ErrorType.NOT_FOUND,
  }),
  ROLE_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Role not found',
      ar: 'الدور غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'ROLE_NOT_FOUND',
  }),
  ROLE_ALREADY_EXISTS: new CustomError({
    localizedMessage: {
      en: 'Role already exists',
      ar: 'الدور موجود بالفعل',
    },
    errorType: ErrorType.CONFLICT,
    event: 'ROLE_ALREADY_EXISTS',
  }),
  ADMIN_EMAIL_EXISTS: new CustomError({
    localizedMessage: {
      en: 'Email already exists',
      ar: 'البريد الإلكتروني موجود بالفعل',
    },
    errorType: ErrorType.CONFLICT,
    event: 'ADMIN_EMAIL_EXISTS',
  }),
  ADMIN_ROLE_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Admin role not found',
      ar: 'الدور غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'ADMIN_ROLE_NOT_FOUND',
  }),
};
