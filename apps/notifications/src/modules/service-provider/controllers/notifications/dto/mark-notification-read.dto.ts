import { IsMongoId } from 'class-validator';

export class MarkNotificationReadParamsDto {
  @IsMongoId()
  notificationId: string;
}
