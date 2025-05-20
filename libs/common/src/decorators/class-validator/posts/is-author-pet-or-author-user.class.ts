import { Post } from '@common/schemas/mongoose/post/post.type';
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface, isInstance } from 'class-validator';
import { Types } from 'mongoose';

@ValidatorConstraint({ name: 'IsAuthorPetOrAuthorUser', async: false })
export class IsAuthorPetOrAuthorUser implements ValidatorConstraintInterface {
  validationMessage: string;

  validate(value: any, validationArguments?: ValidationArguments): boolean | Promise<boolean> {
    const { authorUser, authorPet } = validationArguments?.object as Post;

    if (!authorUser && !authorPet) {
      return true;
    }

    if (authorUser && authorPet) {
      this.validationMessage = 'Only one of authorUser or authorPet can be provided';
      return false;
    }

    if (authorUser && !isInstance(authorUser, Types.ObjectId)) {
      this.validationMessage = 'authorUser must be an ObjectId';
      return false;
    }

    if (authorPet && !isInstance(authorPet, Types.ObjectId)) {
      this.validationMessage = 'authorPet must be an ObjectId';
      return false;
    }

    return true;
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return this.validationMessage;
  }
}
