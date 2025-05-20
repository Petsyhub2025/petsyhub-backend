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
  PRODUCT_CATEGORY_NAME_ALREADY_EXISTS: new CustomError({
    localizedMessage: {
      en: 'Product Category name is already exists',
      ar: 'اسم فئة الفئة للمنتج موجود بالفعل',
    },
    errorType: ErrorType.CONFLICT,
    event: 'PRODUCT_CATEGORY_NAME_ALREADY_EXISTS',
  }),
  PRODUCT_CATEGORY_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Product category not found',
      ar: 'لم يتم العثور على الفئة للمنتج',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'PRODUCT_CATEGORY_NOT_FOUND',
  }),
  PRODUCT_SUBCATEGORY_NAME_ALREADY_EXISTS: new CustomError({
    localizedMessage: {
      en: 'Product SubCategory name is already exists',
      ar: 'اسم فئة الفئة الفرعية للمنتج موجود بالفعل',
    },
    errorType: ErrorType.CONFLICT,
    event: 'PRODUCT_SUBCATEGORY_NAME_ALREADY_EXISTS',
  }),
  PRODUCT_SUBCATEGORY_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Product category not found',
      ar: 'لم يتم العثور على الفئة الفرعية للمنتج',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'PRODUCT_SUBCATEGORY_NOT_FOUND',
  }),
  PRODUCT_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Product not found',
      ar: 'لم يتم العثور على للمنتج',
    },
    errorType: ErrorType.NOT_FOUND,
    event: 'PRODUCT_NOT_FOUND',
  }),
};
