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
    errorType: ErrorType.CONFLICT,
    event: 'CUSTOMER_NOT_FOUND',
  }),
  GOOGLE_ACCOUNT_LINK_FAILED: new CustomError({
    localizedMessage: {
      en: 'Failed to link Google account',
      ar: 'فشل ربط حساب جوجل',
    },
    event: 'GOOGLE_AUTHENTICATION_FAILED',
    errorType: ErrorType.UNAUTHORIZED,
  }),
  APPLE_ACCOUNT_LINK_FAILED: new CustomError({
    localizedMessage: {
      en: 'Failed to link Apple account',
      ar: 'فشل ربط حساب Apple',
    },
    event: 'APPLE_AUTHENTICATION_FAILED',
    errorType: ErrorType.UNAUTHORIZED,
  }),
  EMAIL_ACCESS_REQUIRED: new CustomError({
    localizedMessage: {
      en: 'Email access is required',
      ar: 'الوصول إلى البريد الإلكتروني مطلوب',
    },
    event: 'AUTHENTICATION_FAILED',
    errorType: ErrorType.UNAUTHORIZED,
  }),
  GOOGLE_ACCOUNT_ALREADY_LINKED: new CustomError({
    localizedMessage: {
      en: 'Google account already linked',
      ar: 'تم ربط حساب Google بالفعل',
    },
    event: 'GOOGLE_AUTHENTICATION_FAILED',
    errorType: ErrorType.UNAUTHORIZED,
  }),
  EMAIL_ALREADY_EXISTS: new CustomError({
    localizedMessage: {
      en: 'Email Already Exists',
      ar: 'البريد الإلكتروني موجود بالفعل',
    },
    event: 'EMAIL_ALREADY_EXISTS',
    errorType: ErrorType.UNAUTHORIZED,
  }),
  USER_SOCIAL_EMAIL_ALREADY_EXISTS: new CustomError({
    localizedMessage: {
      en: 'This email is already registered in our Petsy app. Please log in using your credentials to continue',
      ar: 'البريد الالكتروني مسجل بالفعل في التطبيق الخاص بالتواصل الاجتماعي, يرجى تسجيل الدخول باستخدام بيانات الاعتماد الخاصة بك للمتابعة ',
    },
    event: 'USER_SOCIAL_EMAIL_ALREADY_EXISTS',
    errorType: ErrorType.UNAUTHORIZED,
  }),
};
