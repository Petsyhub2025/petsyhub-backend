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
  BRAND_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Brand not found',
      ar: 'العلامة التجارية غير مسجلة',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'BRAND_NOT_FOUND',
  }),
  BRAND_OWNERSHIP_NOT_VALID: new CustomError({
    localizedMessage: {
      en: 'Brand ownership invalid',
      ar: 'ملكية العلامة التجارية غير صالحة',
    },
    errorType: ErrorType.FORBIDDEN,
    event: 'BRAND_OWNERSHIP_NOT_VALID',
  }),
  DUPLICATES_MEMBER_ASSIGNMENT: new CustomError({
    localizedMessage: {
      en: 'Member duplication assignment',
      ar: 'خطأ في ادخال الموظفين',
    },
    errorType: ErrorType.CONFLICT,
    event: 'DUPLICATES_MEMBER_ASSIGNMENT',
  }),
  MANAGER_ROLE_REQUIRED: new CustomError({
    localizedMessage: {
      en: 'You must assign manager for branch',
      ar: 'يجب ادخال مدير للفرع',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'MANAGER_ROLE_REQUIRED',
  }),
  BRANCH_NAME_ALREADY_EXISTS: new CustomError({
    localizedMessage: {
      en: 'Branch name already exists',
      ar: 'اسم الفرع مسجل من قيل',
    },
    errorType: ErrorType.CONFLICT,
    event: 'BRANCH_NAME_ALREADY_EXISTS',
  }),
  ROLE_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Role not found',
      ar: 'الدور غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'ROLE_NOT_FOUND',
  }),
  MEMBER_BRAND_MEMBERSHIP_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Member brand access not found',
      ar: 'الموظف لايوجد في هذه العلامة التجارية',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'MEMBER_BRAND_MEMBERSHIP_NOT_FOUND',
  }),
  ERROR_WHILE_CREATING_BRANCH: new CustomError({
    localizedMessage: {
      en: 'Error while creating branch',
      ar: 'خطأ أثناء انشاء فرع',
    },
    event: 'ERROR_WHILE_CREATING_BRANCH',
  }),
  BRANCH_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Branch not found',
      ar: 'الفرع غير مسجل',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'BRANCH_NOT_FOUND',
  }),
};
