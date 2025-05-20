import { EventTypeEnum } from '@common/schemas/mongoose/event/event.enum';
import type { Event } from '@common/schemas/mongoose/event/event.type';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  isString,
  isNotEmpty,
  maxLength,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsPricingInformationProvidedWhenPaid', async: false })
export class IsPricingInformationProvidedWhenPaid implements ValidatorConstraintInterface {
  validationMessage: string;

  validate(value: any, validationArguments?: ValidationArguments): boolean | Promise<boolean> {
    const { pricingInformation, type } = validationArguments?.object as Event;

    if (type === EventTypeEnum.PAID && pricingInformation == undefined) {
      this.validationMessage = 'Pricing information must be provided when event is paid';
      return false;
    }

    if (type === EventTypeEnum.FREE && pricingInformation != undefined) {
      this.validationMessage = 'Pricing information must not be provided when event is free';
      return false;
    }

    // If type is free and pricingInformation is undefined then we can return true
    if (pricingInformation == undefined) return true;

    if (!isString(pricingInformation)) {
      this.validationMessage = 'Pricing information must be a string';
      return false;
    }

    if (!isNotEmpty(pricingInformation)) {
      this.validationMessage = 'Pricing information must not be empty';
      return false;
    }

    if (!maxLength(pricingInformation, 10000)) {
      this.validationMessage = 'Pricing information must not be longer than 10000 characters';
      return false;
    }

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage?(validationArguments?: ValidationArguments): string {
    return this.validationMessage;
  }
}
