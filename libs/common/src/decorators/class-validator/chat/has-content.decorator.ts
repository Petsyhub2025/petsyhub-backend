import { ChatMessage } from '@common/schemas/mongoose/chat/chat-message';
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'HasContent', async: false })
export class HasContent implements ValidatorConstraintInterface {
  validationMessage: string;

  validate(value: any, validationArguments?: ValidationArguments): boolean | Promise<boolean> {
    const { body, media } = validationArguments?.object as ChatMessage;
    if (!body && !media?.length) {
      this.validationMessage = 'Message must have body or media';
      return false;
    }

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage?(validationArguments?: ValidationArguments): string {
    return this.validationMessage;
  }
}
