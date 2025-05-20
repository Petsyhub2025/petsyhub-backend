import { PickType } from '@nestjs/swagger';
import { GroupChatRoom, IsMediaUploadFileValid, MediaUploadFile } from '@instapets-backend/common';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';

export class UpdateGroupDto extends PickType(GroupChatRoom, ['name'] as const) {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @IsMediaUploadFileValid({ s3Only: true })
  roomPictureMediaUpload?: MediaUploadFile;
}
