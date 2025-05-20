import { parseValidationErrors } from '@common/helpers/validation-error-parser.helper';
import { plainToInstance } from 'class-transformer';
import { Validator } from 'class-validator';
import { Logger } from '@serverless/common/classes/logger.class';

type ClassType = new (...args: any[]) => any;

export async function validateClass(obj: object, validationClass: ClassType) {
  // For class-transformer
  const instance = plainToInstance(validationClass, obj, {
    enableImplicitConversion: true,
  });

  const validator = new Validator();
  const validationErrors = await validator.validate(instance, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  });

  if (validationErrors.length > 0) {
    const errors = parseValidationErrors(validationErrors);

    Logger.getInstance().error(`${validationClass.name} Object Validation failed`, {
      errors,
    });

    throw new Error(`${validationClass.name} Object Validation failed`);
  }
}
