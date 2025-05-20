import { IsDate, ValidationOptions } from 'class-validator';

export const IsDateFromTimestamp = (validationOptions?: ValidationOptions): PropertyDecorator => {
  return IsDate({
    message: 'Invalid date from timestamp',
    ...validationOptions,
  });
};
