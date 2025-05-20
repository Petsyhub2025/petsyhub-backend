import { Brand, IsMediaUploadFileValid, MediaUploadFile } from '@instapets-backend/common';
import { PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';

export class CreateBrandDto extends PickType(Brand, [
  'name',
  'email',
  'phoneNumber',
  'anotherPhoneNumber',
  'hotline',
  'bio',
] as const) {
  @IsObject()
  @ValidateNested()
  @IsMediaUploadFileValid({ s3Only: true })
  @Type(() => MediaUploadFile)
  logoPictureMedia: MediaUploadFile;

  @IsObject()
  @ValidateNested()
  @IsMediaUploadFileValid({ s3Only: true })
  @Type(() => MediaUploadFile)
  coverPictureMedia: MediaUploadFile;
}
