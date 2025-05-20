import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsDateAfterNow(validationOptions?: ValidationOptions): PropertyDecorator {
  validationOptions = {
    message: 'Date must be in the future',
    ...validationOptions,
  };

  return (object: Record<string, any>, propertyName: string): void => {
    registerDecorator({
      name: 'IsDateAfterNow',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) {
            return false;
          }

          const nowTimestamp = Date.now();
          const timestamp = new Date(value).getTime();

          return !isNaN(timestamp) && timestamp > nowTimestamp;
        },
      },
    });
  };
}
