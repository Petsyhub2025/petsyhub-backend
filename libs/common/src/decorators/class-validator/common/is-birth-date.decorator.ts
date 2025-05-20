import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsBirthDate(validationOptions?: ValidationOptions): PropertyDecorator {
  validationOptions = {
    message: 'Date must be a valid DD-MM-YYYY format',
    ...validationOptions,
  };

  return (object: Record<string, any>, propertyName: string): void => {
    registerDecorator({
      name: 'IsBirthDate',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        validate(value: any, args: ValidationArguments) {
          const isMatched = /^\d{2}-\d{2}-\d{4}$/.test(value);

          if (!isMatched) {
            return false;
          }

          const parts = value.split('-');
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);

          const date = new Date(year, month, day);
          const isValid = date.getDate() === day && date.getMonth() === month && date.getFullYear() === year;

          return isValid;
        },
      },
    });
  };
}
