import { ErrorType } from '@common/enums';
import { InternalServerErrorException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Validator } from 'class-validator';
import { Document } from 'mongoose';
import { parseValidationErrors } from './validation-error-parser.helper';
import { CustomError } from '@common/classes/custom-error.class';

type ClassType = new (...args: any[]) => any;

export async function validateSchema(doc: Document | object, validationClass: ClassType) {
  // For class-transformer
  const instance = plainToInstance(validationClass, (doc as Document).toObject?.() ?? doc, {
    enableImplicitConversion: true,
  });

  const validator = new Validator();
  const validationErrors = await validator.validate(instance, { skipMissingProperties: true });

  if (validationErrors.length > 0) {
    const errors = parseValidationErrors(validationErrors);

    throw new InternalServerErrorException(
      new CustomError({
        localizedMessage: {
          en: `${validationClass.name} Model Validation Error`,
          ar: 'خطأ في التحقق من النموذج',
        },
        errorType: ErrorType.WRONG_INPUT,
        error: errors,
        event: 'VALIDATION_ERROR',
      }),
    );
  }
}
