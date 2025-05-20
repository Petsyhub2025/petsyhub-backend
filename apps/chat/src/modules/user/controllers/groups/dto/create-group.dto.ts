import { PickType } from '@nestjs/swagger';
import { GroupChatRoom, IsArrayUnique, IsMediaUploadFileValid, MediaUploadFile } from '@instapets-backend/common';
import { MAX_GROUP_PARTICIPANTS } from '@chat/user/shared/constants';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsMongoId, IsObject, IsOptional, ValidateNested } from 'class-validator';

export class CreateGroupDto extends PickType(GroupChatRoom, ['name'] as const) {
  @IsMongoId({ each: true })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_GROUP_PARTICIPANTS - 1) //excludes the user
  @IsArrayUnique()
  participants: string[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @IsMediaUploadFileValid({ s3Only: true })
  roomPictureMediaUpload?: MediaUploadFile;
}
