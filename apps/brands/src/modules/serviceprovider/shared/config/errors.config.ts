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
  CLINIC_SERVICE_TYPE_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Clinic Service Type not found',
      ar: 'نوع خدمة العيادة غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'CLINIC_SERVICE_TYPE_NOT_FOUND',
  }),
  SERVICE_PROVIDER_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Service Provider not found',
      ar: 'مقدم الخدمة غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'SERVICE_PROVIDER_NOT_FOUND',
  }),
  ACCOUNT_ALREADY_COMPLETED: new CustomError({
    localizedMessage: {
      en: 'You already completed your profile',
      ar: 'لقد أكملت الملف الشخصي بالفعل',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'ACCOUNT_ALREADY_COMPLETED',
  }),
  BRANCH_STATUS_NOT_VALID: new CustomError({
    localizedMessage: {
      en: 'branch status not valid for this operation',
      ar: 'حالة الفرع غير صالحة لهذه العملية',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'BRANCH_STATUS_NOT_VALID',
  }),
  APPOINTMENT_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Appointment not found',
      ar: 'الميعاد غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'APPOINTMENT_NOT_FOUND',
  }),
  APPOINTMENT_NOT_AUTHORIZED: new CustomError({
    localizedMessage: {
      en: 'Appointment not authorized',
      ar: 'الميعاد غير مصرح لك',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'APPOINTMENT_NOT_AUTHORIZED',
  }),
  APPOINTMENT_STATUS_NOT_VALID: new CustomError({
    localizedMessage: {
      en: 'Appointment status not valid for this operation',
      ar: 'حالة الميعاد غير صالحة لهذه العملية',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'APPOINTMENT_STATUS_NOT_VALID',
  }),
  CLINIC_BRANCH_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Clinic branch not found',
      ar: 'لا يوجد هذا الفرع',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'CLINIC_BRANCH_NOT_FOUND',
  }),
  CLINIC_BRANCH_OWNER_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Manager not found',
      ar: 'لا يوجد هذا المدير',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'CLINIC_BRANCH_OWNER_NOT_FOUND',
  }),
  EMAIL_ALREADY_EXIST: new CustomError({
    localizedMessage: {
      en: 'Email already exist',
      ar: 'البريد الاليكتروني مسجل من قبل',
    },
    errorType: ErrorType.CONFLICT,
    event: 'EMAIL_ALREADY_EXIST',
  }),
  PHONE_NUMBER_ALREADY_EXIST: new CustomError({
    localizedMessage: {
      en: 'Phone number already exist',
      ar: 'رقم الهاتف مسجل من قبل',
    },
    errorType: ErrorType.CONFLICT,
    event: 'PHONE_NUMBER_ALREADY_EXIST',
  }),
};
