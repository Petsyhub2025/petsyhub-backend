import { PickType } from '@nestjs/swagger';
import { IsMediaUploadFileValid, MediaUploadFile, Pet } from '@instapets-backend/common';
import { IsOptional, IsObject, ValidateNested } from 'class-validator';

export class AddPetDto extends PickType(Pet, [
  'bio',
  'gender',
  'height',
  'name',
  'passportNumber',
  'weight',
  'birthDate',
  'breed',
  'type',
] as const) {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @IsMediaUploadFileValid({ s3Only: true })
  profilePictureMediaUpload?: MediaUploadFile;
}
