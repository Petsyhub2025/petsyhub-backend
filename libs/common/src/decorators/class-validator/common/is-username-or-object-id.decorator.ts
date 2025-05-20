import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function isUsernameOrObjectId(value: string): boolean {
  return isUsername(value) || isObjectId(value);
}

export function isUsername(value: string): boolean {
  const usernameRegex = new RegExp('^[a-zA-Z0-9_]{3,20}$');

  return !!value && typeof value === 'string' && usernameRegex.test(value);
}

export function isObjectId(value: string): boolean {
  const objectIdRegex = new RegExp('^[0-9a-fA-F]{24}$');

  return !!value && typeof value === 'string' && objectIdRegex.test(value);
}

export function IsUsernameOrObjectId(validationOptions?: ValidationOptions): PropertyDecorator {
  validationOptions = {
    message: 'Identifier must be a valid username or object id',
    ...validationOptions,
  };

  return (object: Record<string, any>, propertyName: string): void => {
    registerDecorator({
      name: 'IsUsernameOrObjectId',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        validate(value: any, args: ValidationArguments) {
          return isUsernameOrObjectId(value);
        },
      },
    });
  };
}
