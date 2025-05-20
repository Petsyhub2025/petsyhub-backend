import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import type { CreateEventDto } from '../../dto/create-event.dto';

@ValidatorConstraint({ name: 'IsStartDateBelowEndDate', async: false })
export class IsStartDateBelowEndDate implements ValidatorConstraintInterface {
  validationMessage: string;

  validate(value: any, validationArguments?: ValidationArguments): boolean | Promise<boolean> {
    const { startDate, endDate } = validationArguments?.object as CreateEventDto;

    if (!startDate || !endDate) {
      this.validationMessage = 'Start date and end date are required';
      return false;
    }

    if (startDate >= endDate) {
      this.validationMessage = 'Start date must be before end date';
      return false;
    }

    return true;
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return this.validationMessage;
  }
}
