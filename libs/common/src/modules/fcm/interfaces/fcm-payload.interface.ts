import { NotificationPriorityEnum } from '@common/schemas/mongoose/notification/notification.enum';
import { INotificationData } from '@common/schemas/mongoose/notification/notification.type';

export interface FCMPayload {
  title: string;
  body: string;
  priority?: NotificationPriorityEnum;
  timeToLive?: number;
  imageUrl?: string;
  data?: INotificationData;
}

export interface FCMTokenPayload extends FCMPayload {
  tokens: string[];
}

export interface FCMTopicPayload extends FCMPayload {
  topic: string;
}
