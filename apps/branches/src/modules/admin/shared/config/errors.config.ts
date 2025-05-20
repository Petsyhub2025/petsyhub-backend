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
  BRANCH_SERVICE_TYPE_ALREADY_EXISTS: new CustomError({
    localizedMessage: {
      en: 'Branch Service Type already exists',
      ar: 'نوع خدمة موجود بالفعل',
    },
    errorType: ErrorType.CONFLICT,
    event: 'BRANCH_SERVICE_TYPE_ALREADY_EXISTS',
  }),
  BRANCH_SERVICE_TYPE_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Branch Service Type not found',
      ar: 'نوع خدمة غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'BRANCH_SERVICE_TYPE_NOT_FOUND',
  }),
  BRANCH_SERVICE_TYPE_ALREADY_ASSIGNED_TO_BRANCHES: new CustomError({
    localizedMessage: {
      en: 'Branch Service Type already assigned to branches',
      ar: 'نوع خدمة موجود بالفعل في احدي الفرع',
    },
    errorType: ErrorType.CONFLICT,
    event: 'BRANCH_SERVICE_TYPE_ALREADY_EXISTS',
  }),
  MEDICAL_SPECIALTY_ALREADY_EXISTS: new CustomError({
    localizedMessage: {
      en: 'Medical Specialty already exists',
      ar: 'التخصص الطبي موجود بالفعل',
    },
    errorType: ErrorType.CONFLICT,
    event: 'MEDICAL_SPECIALTY_ALREADY_EXISTS',
  }),
  MEDICAL_SPECIALTY_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Medical Specialty not found',
      ar: 'التخصص الطبي غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'MEDICAL_SPECIALTY_NOT_FOUND',
  }),
  MEDICAL_SPECIALTY_ALREADY_ASSIGNED_TO_BRANCHES: new CustomError({
    localizedMessage: {
      en: 'Medical Specialty already assigned to branches',
      ar: 'التخصص الطبي موجود بالفعل في احدي الفرع',
    },
    errorType: ErrorType.CONFLICT,
    event: 'MEDICAL_SPECIALTY_ALREADY_ASSIGNED_TO_BRANCHES',
  }),
  BRANCH_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Branch not found',
      ar: 'الفرع غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'BRANCH_NOT_FOUND',
  }),
  BRANCH_STATUS_NOT_VALID: new CustomError({
    localizedMessage: {
      en: 'Branch status not valid for this operation',
      ar: 'حالة الفرع غير صالحة لهذه العملية',
    },
    errorType: ErrorType.CONFLICT,
    event: 'BRANCH_STATUS_NOT_VALID',
  }),
  INVALID_DATE_RANGE: new CustomError({
    localizedMessage: {
      en: 'Invalid date range',
      ar: 'نطاق التاريخ غير صالح',
    },
    event: 'INVALID_DATE_RANGE',
  }),
  BRANCH_ACCESS_ROLE_NAME_EXISTS: new CustomError({
    localizedMessage: {
      en: 'Branch Access Control Role already exists',
      ar: 'دور التحكم في الوصول إلى الفرع موجود بالفعل',
    },
    errorType: ErrorType.CONFLICT,
    event: 'BRANCH_ACCESS_ROLE_NAME_EXISTS',
  }),
};
