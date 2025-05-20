import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

type Property = { key: string; value: any };

export function IsExistentWhenAnotherPropertyMatches(
  properties: Property[],
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: Record<string, any>, propertyName: string): void => {
    registerDecorator({
      name: 'IsExistentWhenAnotherPropertyMatches',
      target: object.constructor,
      propertyName,
      constraints: [properties],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [properties] = args.constraints;
          const isMatched = properties.some((property: Property) => {
            const relatedValue = (args.object as Record<string, any>)[property.key];
            return relatedValue === property.value;
          });

          return isMatched;
        },
      },
    });
  };
}
