import {
  IsDateAfterNow,
  IsDateFromTimestamp,
  IsMediaUploadFileValid,
  MediaUploadFile,
  TransformTimeStamp,
  UserPushNotification,
} from '@instapets-backend/common';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsObject, ValidateNested } from 'class-validator';

export class CreateUserPushNotificationDto extends PickType(UserPushNotification, [
  'title',
  'body',
  'dynamicLinkId',
  'includeAllUsers',
  'userSegments',
  'name',
] as const) {
  @IsDateAfterNow()
  @IsDateFromTimestamp()
  @TransformTimeStamp()
  @ApiProperty({ type: Number, description: 'Timestamp in milliseconds' })
  scheduledDate: Date;

  @IsObject()
  @ValidateNested()
  @IsMediaUploadFileValid({ s3Only: true })
  mediaUpload: MediaUploadFile;
}
