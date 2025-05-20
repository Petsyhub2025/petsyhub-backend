import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'IsAllowedUsersOrIsPrivatePresent', async: false })
export class IsAllowedUsersOrIsPrivatePresent implements ValidatorConstraintInterface {
  validationMessage: string;

  validate(value: any, validationArguments?: ValidationArguments): boolean | Promise<boolean> {
    const { allowedUsers, isPrivate } = validationArguments?.object as any;

    if (!allowedUsers && isPrivate === undefined) {
      return true;
    }

    if (allowedUsers && isPrivate !== undefined) {
      this.validationMessage = 'Only one of allowedUsers or isPrivate can be provided';
      return false;
    }

    return true;
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return this.validationMessage;
  }
}
