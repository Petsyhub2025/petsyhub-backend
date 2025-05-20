import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { EditProfileDto } from '../dto/edit-profile.dto';

@ValidatorConstraint({ name: 'IsCountryAndCityProvided', async: false })
export class IsCountryCityAreaProvided implements ValidatorConstraintInterface {
  validationMessage: string;

  validate(value: any, validationArguments?: ValidationArguments): boolean | Promise<boolean> {
    const { country, city } = validationArguments?.object as EditProfileDto;

    if (!country && !city) {
      return true;
    }

    if ((country && !city) || (!country && city)) {
      this.validationMessage = 'City and country must be provided together';
      return false;
    }

    // if ((city && !area) || (!city && area)) {
    //   this.validationMessage = 'City, country and area must be provided together';
    //   return false;
    // }

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage?(validationArguments?: ValidationArguments): string {
    return this.validationMessage;
  }
}
