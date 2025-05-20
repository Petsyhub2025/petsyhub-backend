import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { GetPostsQueryDto } from '@posts/user/controllers/posts/dto/get-posts.dto';

@ValidatorConstraint({ name: 'IsUserAndPetIdProvided', async: false })
export class IsUserAndPetIdProvided implements ValidatorConstraintInterface {
  validationMessage: string;

  validate(value: any, validationArguments?: ValidationArguments): boolean | Promise<boolean> {
    const { petId, userId } = validationArguments?.object as GetPostsQueryDto;

    if (!petId && !userId) {
      return true;
    }

    if (petId && userId) {
      this.validationMessage = 'Only one of userId or petId can be provided';
      return false;
    }

    return true;
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return this.validationMessage;
  }
}
