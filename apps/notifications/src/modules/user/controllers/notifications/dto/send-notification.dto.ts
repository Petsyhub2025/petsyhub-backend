import { UserNotificationDto } from '@instapets-backend/common';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsObject, ValidateNested } from 'class-validator';

export class SendSingleNotificationDto {
  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  notification: UserNotificationDto;
}

export class SendMultiNotificationDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UserNotificationDto)
  notifications: UserNotificationDto[];
}
