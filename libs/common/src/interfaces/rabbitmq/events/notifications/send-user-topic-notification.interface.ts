import { UserFcmTopicsEnum } from '@common/enums';
import { IUserTopicNotification } from '@common/schemas/mongoose/notification/notification.type';

export interface ISendUserTopicNotificationEvent extends IUserTopicNotification {
  topic: UserFcmTopicsEnum;
}
