import { PartialType, PickType } from '@nestjs/swagger';
import { IsMediaUploadFileValid, MediaUploadFile, User } from '@instapets-backend/common';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsObject, IsOptional, Validate, ValidateNested } from 'class-validator';
import { Types } from 'mongoose';
import { IsCountryCityAreaProvided } from '@users/user/controllers/user-profile/custom-validation/edit-profile.class';
import { Type } from 'class-transformer';

export class EditProfileDto extends PartialType(
  PickType(User, [
    'bio',
    'firstName',
    'lastName',
    'username',
    'isPrivate',
    'isDiscoverable',
    'city',
    'country',
    'area',
    'gender',
    'birthDate',
    'settings',
  ] as const),
) {
  @Validate(IsCountryCityAreaProvided)
  country?: Types.ObjectId;

  @Validate(IsCountryCityAreaProvided)
  city?: Types.ObjectId;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @IsMediaUploadFileValid({ s3Only: true })
  profilePictureMediaUpload?: MediaUploadFile;
}
