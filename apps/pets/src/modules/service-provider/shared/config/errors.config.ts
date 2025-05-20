import { CustomError, ErrorType } from '@instapets-backend/common';

export const errorManager = {
  SERVICE_PROVIDER_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Service Provider not found',
      ar: 'مقدم الخدمة غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'SERVICE_PROVIDER_NOT_FOUND',
  }),
  ACCOUNT_HAVE_NO_BRANCH: new CustomError({
    localizedMessage: {
      en: 'No branch found for your account. Please create a branch to continue',
      ar: 'لا يوجد فرع متاح لحسابك بعد. الرجاء إضافة فرع للمتابعة',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'ACCOUNT_HAVE_NO_BRANCH',
  }),
};
