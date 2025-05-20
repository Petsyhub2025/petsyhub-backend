import type { MinMaxRange } from '@common/schemas/mongoose/common/min-max-range/min-max-range.type';
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'IsMinLowerThanMax', async: false })
export class IsMinLowerThanMax implements ValidatorConstraintInterface {
  validationMessage: string;

  validate(value: any, validationArguments?: ValidationArguments): boolean | Promise<boolean> {
    const { min, max } = validationArguments?.object as MinMaxRange;

    if (min == undefined || max == undefined) {
      return true;
    }

    if (min > max) {
      this.validationMessage = 'min must be lower than max';
      return false;
    }

    return true;
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return this.validationMessage;
  }
}
