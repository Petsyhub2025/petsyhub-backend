import { IsMediaUploadFileValid, MediaUploadFile, Topic } from '@instapets-backend/common';
import { PickType } from '@nestjs/swagger';
import { IsObject, ValidateNested } from 'class-validator';

export class CreateTopicDto extends PickType(Topic, ['name'] as const) {
  @IsObject()
  @ValidateNested()
  @IsMediaUploadFileValid({ s3Only: true })
  icon: MediaUploadFile;
}
