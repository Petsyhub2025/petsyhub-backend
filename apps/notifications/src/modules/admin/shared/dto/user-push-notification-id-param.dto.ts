import { IsMongoId } from 'class-validator';

export class UserPushNotificationIdParamDto {
  @IsMongoId()
  userPushNotificationId: string;
}
