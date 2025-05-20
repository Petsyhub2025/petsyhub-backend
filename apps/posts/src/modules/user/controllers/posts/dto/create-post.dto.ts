import { ApiProperty, PickType } from '@nestjs/swagger';
import {
  IsMediaUploadFileValid,
  MediaUploadFile,
  Post,
  TransformObjectId,
  TransformObjectIds,
} from '@instapets-backend/common';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsInstance,
  IsObject,
  IsOptional,
  Validate,
  ValidateNested,
} from 'class-validator';
import { IsAllowedUsersOrIsPrivatePresent } from '@posts/user/controllers/posts/custom-validation/create-post.class';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';

export class CreatePostDto extends PickType(Post, [
  'body',
  'checkInLocation',
  'allowedUsers',
  'isPrivate',
  'taggedPets',
  'taggedUsers',
] as const) {
  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  postAsPetId?: Types.ObjectId;

  @Validate(IsAllowedUsersOrIsPrivatePresent)
  isPrivate?: boolean;

  @Validate(IsAllowedUsersOrIsPrivatePresent)
  allowedUsers?: Types.ObjectId[];

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @IsMediaUploadFileValid({ s3Only: true }, { each: true })
  @Type(() => MediaUploadFile)
  mediaUploads: MediaUploadFile[];

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @ApiProperty({ type: [String] })
  topics: Types.ObjectId[];
}
