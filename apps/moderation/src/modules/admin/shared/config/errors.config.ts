import { CustomError, ErrorType } from '@instapets-backend/common';

export const errorManager = {
  REPORT_CANNOT_BE_ACTIONED: new CustomError({
    localizedMessage: {
      en: 'Report cannot be actioned',
      ar: 'لا يمكن اتخاذ إجراء على التقرير',
    },
    errorType: ErrorType.WRONG_REQUEST,
    event: 'REPORT_CANNOT_BE_ACTIONED',
  }),
  REPORT_CANNOT_BE_REJECTED: new CustomError({
    localizedMessage: {
      en: 'Report cannot be rejected',
      ar: 'لا يمكن رفض التقرير',
    },
    errorType: ErrorType.WRONG_REQUEST,
    event: 'REPORT_CANNOT_BE_REJECTED',
  }),
  REPORT_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Report not found',
      ar: 'التقرير غير موجود',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'REPORT_NOT_FOUND',
  }),
};
