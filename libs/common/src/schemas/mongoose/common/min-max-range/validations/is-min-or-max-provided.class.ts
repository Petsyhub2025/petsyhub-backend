import type { MinMaxRange } from '@common/schemas/mongoose/common/min-max-range/min-max-range.type';
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface, isNumber } from 'class-validator';

@ValidatorConstraint({ name: 'IsMinOrMaxProvided', async: false })
export class IsMinOrMaxProvided implements ValidatorConstraintInterface {
  validationMessage: string;

  validate(value: any, validationArguments?: ValidationArguments): boolean | Promise<boolean> {
    const { min, max } = validationArguments?.object as MinMaxRange;

    if (min == undefined && max == undefined) {
      this.validationMessage = 'min or max must be provided';
      return false;
    }

    if (min != undefined && !isNumber(min)) {
      this.validationMessage = 'min must be a number';
      return false;
    }

    if (max != undefined && !isNumber(max)) {
      this.validationMessage = 'max must be a number';
      return false;
    }

    return true;
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return this.validationMessage;
  }
}
