import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsArrayUnique(validationOptions?: ValidationOptions) {
  if (!validationOptions || validationOptions.message)
    validationOptions = { message: 'Array is not unique', ...(validationOptions ?? {}) };

  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsArrayUnique',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        validate(value: any, args: ValidationArguments) {
          return isArrayUnique(value);
        },
      },
    });
  };
}

export function isArrayUnique(value: string[]): boolean {
  return Array.isArray(value) && new Set(value).size === value.length;
}
