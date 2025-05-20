import type { DynamicLink } from '@common/schemas/mongoose/marketing/dynamic-link/dynamic-link.type';
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'IsLinkedToExistsWhenUsingLinkedMedia', async: true })
export class IsLinkedToExistsWhenUsingLinkedMedia implements ValidatorConstraintInterface {
  validationMessage: string;

  async validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> {
    const { useLinkedMedia, linkedTo } = validationArguments?.object as DynamicLink;

    if (useLinkedMedia && linkedTo == undefined) {
      this.validationMessage = 'Linked to must be provided when using linked media';
      return false;
    }

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage?(validationArguments?: ValidationArguments): string {
    return this.validationMessage;
  }
}
