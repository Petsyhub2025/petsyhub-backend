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
  CANNOT_FOLLOW_YOURSELF: new CustomError({
    localizedMessage: {
      en: 'You cannot follow yourself',
      ar: 'لا يمكنك متابعة نفسك',
    },
    errorType: ErrorType.WRONG_REQUEST,
    event: 'CANNOT_FOLLOW_YOURSELF',
  }),
  WRONG_VERSION_TYPE: new CustomError({
    localizedMessage: {
      en: 'Wrong version type',
      ar: 'نوع الإصدار خاطئ',
    },
    errorType: ErrorType.WRONG_REQUEST,
    event: 'WRONG_VERSION_TYPE',
  }),
  USER_NOT_FOLLOWED: new CustomError({
    localizedMessage: {
      en: 'User not followed',
      ar: 'المستخدم غير متابع',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'USER_NOT_FOLLOWED',
  }),
  PENDING_REQUEST_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Pending request not found',
      ar: 'لم يتم العثور على طلب معلق',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'PENDING_REQUEST_NOT_FOUND',
  }),
  PENDING_FOLLOW_ALREADY_EXISTS: new CustomError({
    localizedMessage: {
      en: 'You already sent a follow request to this user',
      ar: 'لقد أرسلت بالفعل طلب متابعة لهذا المستخدم',
    },
    errorType: ErrorType.CONFLICT,
    event: 'PENDING_FOLLOW_ALREADY_EXISTS',
  }),
  FOLLOW_ALREADY_EXISTS: new CustomError({
    localizedMessage: {
      en: 'You already follow this user',
      ar: 'أنت تتابع هذا المستخدم بالفعل',
    },
    errorType: ErrorType.CONFLICT,
    event: 'FOLLOW_ALREADY_EXISTS',
  }),
  USER_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'User not found',
      ar: 'المستخدم غير موجود',
    },
    errorType: ErrorType.CONFLICT,
    event: 'USER_NOT_FOUND',
  }),
  CANNOT_BLOCK_YOURSELF: new CustomError({
    localizedMessage: {
      en: 'You cannot block yourself',
      ar: 'لا يمكنك حظر نفسك',
    },
    errorType: ErrorType.CONFLICT,
    event: 'CANNOT_BLOCK_YOURSELF',
  }),
  CANNOT_UNBLOCK_YOURSELF: new CustomError({
    localizedMessage: {
      en: 'You cannot unblock yourself',
      ar: 'لا يمكنك إلغاء حظر نفسك',
    },
    errorType: ErrorType.CONFLICT,
    event: 'CANNOT_UNBLOCK_YOURSELF',
  }),
  USER_NOT_BLOCKED: new CustomError({
    localizedMessage: {
      en: 'User not blocked',
      ar: 'المستخدم غير محظور',
    },
    errorType: ErrorType.CONFLICT,
    event: 'USER_NOT_BLOCKED',
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
  WRONG_ONBOARDING_STEP: new CustomError({
    localizedMessage: {
      en: 'Wrong onboarding step',
      ar: 'خطوة التسجيل خاطئة',
    },
    event: 'WRONG_ONBOARDING_STEP',
    errorType: ErrorType.UNAUTHORIZED,
  }),
  ONBOARDING_STEPS_NOT_COMPLETED: new CustomError({
    localizedMessage: {
      en: 'Onboarding steps not completed',
      ar: 'لم يتم إكمال خطوات التسجيل',
    },
    event: 'ONBOARDING_STEPS_NOT_COMPLETED',
    errorType: ErrorType.UNAUTHORIZED,
  }),
  ONBOARDING_ALREADY_DONE: new CustomError({
    localizedMessage: {
      en: 'Onboarding already done',
      ar: 'تم إكمال التسجيل بالفعل',
    },
    event: 'ONBOARDING_ALREADY_DONE',
    errorType: ErrorType.UNAUTHORIZED,
  }),
  COUNTRY_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Country not found',
      ar: 'البلد غير موجود',
    },
    event: 'COUNTRY_NOT_FOUND',
    errorType: ErrorType.NOT_FOUND,
  }),
  CITY_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'City not found',
      ar: 'المدينة غير موجودة',
    },
    event: 'CITY_NOT_FOUND',
    errorType: ErrorType.NOT_FOUND,
  }),
  COUNTRY_AND_CITY_REQUIRED: new CustomError({
    localizedMessage: {
      en: 'Country and city required',
      ar: 'البلد والمدينة مطلوبان',
    },
    event: 'COUNTRY_AND_CITY_REQUIRED',
    errorType: ErrorType.INVALID,
  }),
  FIRST_NAME_AND_LAST_NAME_REQUIRED: new CustomError({
    localizedMessage: {
      en: 'First name and last name are required',
      ar: 'الاسم الأول والاسم الأخير مطلوبان',
    },
    event: 'AUTHENTICATION_FAILED',
    errorType: ErrorType.UNAUTHORIZED,
  }),
  COGNITO_CREDENTIALS_FAILED: new CustomError({
    localizedMessage: {
      en: 'Failed to fetch Cognito credentials',
      ar: 'فشل في جلب بيانات الاعتماد من Cognito',
    },
    event: 'COGNITO_CREDENTIALS_FAILED',
  }),
  TOPIC_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Topic not found',
      ar: 'الموضوع غير موجود',
    },
    event: 'TOPIC_NOT_FOUND',
    errorType: ErrorType.NOT_FOUND,
  }),
  TOPICS_DUPLICATED: new CustomError({
    localizedMessage: {
      en: 'Selected topics are duplicated',
      ar: 'المواضيع المختارة متكررة',
    },
    event: 'TOPICS_DUPLICATED',
    errorType: ErrorType.CONFLICT,
  }),
};
