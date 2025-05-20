import { PickType } from '@nestjs/swagger';
import { FoundPost, IsMediaUploadFileValid, LocationDto, MediaUploadFile } from '@instapets-backend/common';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFoundPostDto extends PickType(FoundPost, ['description', 'foundPet'] as const) {
  @IsObject()
  @ValidateNested()
  location: LocationDto;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(3)
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @IsMediaUploadFileValid({ s3Only: false }, { each: true })
  @Type(() => MediaUploadFile)
  mediaUploads: MediaUploadFile[];
}
