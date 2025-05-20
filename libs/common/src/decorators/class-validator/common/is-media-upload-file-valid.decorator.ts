import { mediaS3FileSchema, mediaUploadFileSchema } from '@common/schemas/joi';
import { MediaUploadFile } from '@common/schemas/mongoose/common/media';
import { ValidationArguments, ValidationOptions, registerDecorator } from 'class-validator';

type MediaUploadFileValidationOptions = {
  s3Only?: boolean;
};

export function IsMediaUploadFileValid(
  mediaUploadFileValidationOptions?: MediaUploadFileValidationOptions,
  validationOptions?: ValidationOptions,
) {
  validationOptions = { message: 'Invalid Media Upload File', ...(validationOptions ?? {}) };

  const { s3Only } = mediaUploadFileValidationOptions ?? {};

  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsMediaUploadFileValid',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return s3Only ? isMediaS3FileValid(value) : isMediaUploadFileValid(value);
        },
      },
    });
  };
}

export function isMediaS3FileValid(value: MediaUploadFile): boolean {
  const { error } = mediaS3FileSchema.validate(value);

  return !error;
}

export function isMediaUploadFileValid(value: MediaUploadFile): boolean {
  const { error } = mediaUploadFileSchema.validate(value);

  return !error;
}
