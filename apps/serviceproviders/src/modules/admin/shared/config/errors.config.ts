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

  SERVICE_PROVIDER_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Service Provider not found',
      ar: 'مقدم الخدمة غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'SERVICE_PROVIDER_NOT_FOUND',
  }),
  SERVICE_PROVIDER_BRANCH_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Service Provider Branch not found',
      ar: 'فرع مقدم الخدمة غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'SERVICE_PROVIDER_BRANCH_NOT_FOUND',
  }),
  UNAUTHORIZED_TO_UPDATE_SERVICE_PROVIDER_BRANCH: new CustomError({
    localizedMessage: {
      en: 'Unauthorized to update service provider branch',
      ar: 'غير مصرح لك بتحديث فرع مقدم الخدمة',
    },
    errorType: ErrorType.UNAUTHORIZED,
    event: 'UNAUTHORIZED_TO_UPDATE_SERVICE_PROVIDER_BRANCH',
  }),
  NOT_IMPLEMENTED: new CustomError({
    localizedMessage: {
      en: 'Not implemented',
      ar: 'غير مفعل',
    },
    errorType: ErrorType.MISSING,
    event: 'NOT_IMPLEMENTED',
  }),
  APPOINTMENT_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Appointment not found',
      ar: 'الموعد غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'APPOINTMENT_NOT_FOUND',
  }),
};
