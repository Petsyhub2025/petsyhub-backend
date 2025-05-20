import { IsString, MaxLength } from 'class-validator';

export class CancelUserPushNotificationDto {
  @IsString()
  @MaxLength(200)
  cancellationReason: string;
}
