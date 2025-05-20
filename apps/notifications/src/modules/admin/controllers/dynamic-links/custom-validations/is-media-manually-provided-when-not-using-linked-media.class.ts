import type { CreateDynamicLinkDto } from '../dto/create-dynamic-link.dto';
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'IsMediaManuallyProvidedWhenNotUsingLinkedMedia', async: true })
export class IsMediaManuallyProvidedWhenNotUsingLinkedMedia implements ValidatorConstraintInterface {
  validationMessage: string;

  async validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> {
    const { useLinkedMedia, previewMediaUpload } = validationArguments?.object as CreateDynamicLinkDto;

    if (useLinkedMedia && previewMediaUpload != undefined) {
      this.validationMessage = 'Preview media must not be provided when using linked media';
      return false;
    }

    if (!useLinkedMedia && previewMediaUpload == undefined) {
      this.validationMessage = 'Preview media must be provided when not using linked media';
      return false;
    }

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage?(validationArguments?: ValidationArguments): string {
    return this.validationMessage;
  }
}
