import { CustomError } from '@common/classes/custom-error.class';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ErrorType } from '../enums/error-type.enum';
import { parseValidationErrors } from '@common/helpers/validation-error-parser.helper';

export const HttpClassValidatorPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  exceptionFactory: (validationErrors: ValidationError[] = []) => {
    return new BadRequestException(
      new CustomError({
        localizedMessage: {
          en: 'Validation failed',
          ar: 'فشل التحقق من الصحة',
        },
        errorType: ErrorType.WRONG_INPUT,
        event: 'VALIDATION_FAILED',
        error: parseValidationErrors(validationErrors),
      }),
    );
  },
});
