import { CustomError } from '@common/classes/custom-error.class';
import { ErrorType } from '@common/enums';
import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ObjectPropertiesSchema } from 'joi';

@Injectable()
export class JoiValidationPipe<T = any> implements PipeTransform {
  constructor(private schema: ObjectPropertiesSchema) {}

  transform(value: T, metadata: ArgumentMetadata): T {
    const { error, value: validatedValue } = this.schema.validate(value);

    if (error) {
      throw new BadRequestException(
        new CustomError({
          localizedMessage: {
            en: 'Validation failed',
            ar: 'فشل التحقق من البيانات',
          },
          error: error.details[0],
          event: 'VALIDATION_FAILED',
          errorType: ErrorType.WRONG_INPUT,
        }),
      );
    }

    return validatedValue;
  }
}
