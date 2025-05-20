import { UserPushNotification } from '@common/schemas/mongoose/marketing/user-push-notification/user-push-notification.type';
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'ShouldUserSegmentsBeProvided', async: false })
export class ShouldUserSegmentsBeProvided implements ValidatorConstraintInterface {
  validationMessage: string;

  validate(value: any, validationArguments?: ValidationArguments): boolean | Promise<boolean> {
    const { includeAllUsers, userSegments } = validationArguments?.object as UserPushNotification;

    if (includeAllUsers && userSegments?.length > 0) {
      this.validationMessage = 'includeAllUsers cannot be true if userSegments are provided';
      return false;
    }

    if (includeAllUsers === false && userSegments?.length === 0) {
      this.validationMessage = 'userSegments must be provided if includeAllUsers is false';
      return false;
    }

    return true;
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return this.validationMessage;
  }
}
