import { AdminFcmTopicsEnum } from '@common/enums';
import { IAdminNotification } from '@common/schemas/mongoose/notification/notification.type';

export interface ISendAdminNotificationEvent extends IAdminNotification {
  topic: AdminFcmTopicsEnum;
}
