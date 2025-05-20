import { ValidationPipe } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ValidationError } from 'class-validator';
import { ErrorType } from '../enums/error-type.enum';
import { WsCustomError } from '@common/classes/ws';
import { parseValidationErrors } from '@common/helpers/validation-error-parser.helper';

export const WsClassValidatorPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  exceptionFactory: (validationErrors: ValidationError[] = []) => {
    return new WsException(
      new WsCustomError({
        localizedMessage: {
          en: 'Validation failed',
          ar: 'فشل التحقق من الصحة',
        },
        errorType: ErrorType.WRONG_INPUT,
        eventName: 'VALIDATION_FAILED',
        error: parseValidationErrors(validationErrors),
      }),
    );
  },
});
