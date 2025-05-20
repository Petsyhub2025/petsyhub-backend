import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsMediaUploadFileValid, MediaUploadFile, TransformObjectIds, User } from '@instapets-backend/common';
import {
  IsOptional,
  IsObject,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  ArrayNotEmpty,
  IsInstance,
} from 'class-validator';
import { Types } from 'mongoose';

export class FinalizeOnboardingDto extends PickType(User, ['firstName', 'lastName', 'gender'] as const) {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @IsMediaUploadFileValid({ s3Only: true })
  profilePictureMediaUpload?: MediaUploadFile;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(2)
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @ApiProperty({ type: [String] })
  userTopics: Types.ObjectId[];
}
