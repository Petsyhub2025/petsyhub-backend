import { ApiProperty, PickType } from '@nestjs/swagger';
import {
  IsMediaUploadFileValid,
  LocationDto,
  LostPost,
  MediaUploadFile,
  TransformObjectId,
} from '@instapets-backend/common';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsInstance, IsObject, ValidateNested } from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';

export class CreateLostPostDto extends PickType(LostPost, ['description', 'reward'] as const) {
  @IsObject()
  @ValidateNested()
  location: LocationDto;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({
    type: String,
  })
  petId: Types.ObjectId;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(3)
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @IsMediaUploadFileValid({ s3Only: false }, { each: true })
  @Type(() => MediaUploadFile)
  mediaUploads: MediaUploadFile[];
}
