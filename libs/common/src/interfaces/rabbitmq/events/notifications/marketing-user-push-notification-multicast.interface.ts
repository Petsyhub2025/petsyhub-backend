import { UserPushNotificationMulticastNotificationDto } from '@common/schemas/mongoose/notification/notification.type';
import { UserNotification } from '@common/schemas/mongoose/notification/user-notification';
import { OmitType } from '@nestjs/swagger';

export class MarketingUserNotification extends OmitType(UserNotification, [
  'receiverUser',
  'isRead',
  'dynamicLink',
] as const) {}

export interface IMarketingUserPushNotificationMulticastEvent {
  userIds: string[];
  fcmMessages: UserPushNotificationMulticastNotificationDto[];
  userNotification: MarketingUserNotification;
}
