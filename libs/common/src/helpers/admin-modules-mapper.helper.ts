import { AdminFcmTopicsEnum } from '@common/enums';
import { AdminResourcesEnum } from '@common/schemas/mongoose/admin/admin-permissions';
import { AdminUpdateSubscriptionsEnum } from '@common/schemas/mongoose/admin/admin-subschemas/admin-settings';
import { AdminNotificationTypeEnum } from '@common/schemas/mongoose/notification/admin-notification';

/*
  This file contains mappers for multiple admin modules.
  The purpose of these mappers is to map admin modules to notification types and fcm topics and have a single source of truth.
  Which in this case will either be the notification type or the fcm topic, regardless of whether the admin module is being used for permissions or subscriptions.
*/

export function adminSubscriptionToPermissionMapper(subscription: AdminUpdateSubscriptionsEnum) {
  const adminSubscriptionToPermissionMapper = {
    [AdminUpdateSubscriptionsEnum.APPOINTMENT_UPDATES]: AdminResourcesEnum.APPOINTMENTS,
  };

  return adminSubscriptionToPermissionMapper[subscription];
}

export function adminPermissionToNotificationTypeMapper(resource: AdminResourcesEnum) {
  const adminPermissionToNotificationTypeMapper = {
    [AdminResourcesEnum.APPOINTMENTS]: AdminNotificationTypeEnum.NEW_APPOINTMENT,
  };

  return adminPermissionToNotificationTypeMapper[resource];
}

export function adminSubscriptionToFcmTopicMapper(subscription: AdminUpdateSubscriptionsEnum) {
  const adminSubscriptionToFcmTopicMapper = {
    [AdminUpdateSubscriptionsEnum.APPOINTMENT_UPDATES]: AdminFcmTopicsEnum.APPOINTMENTS,
  };

  return adminSubscriptionToFcmTopicMapper[subscription];
}

export function adminPermissionToFcmTopicMapper(resource: AdminResourcesEnum) {
  const adminPermissionToFcmTopicMapper = {
    [AdminResourcesEnum.APPOINTMENTS]: AdminFcmTopicsEnum.APPOINTMENTS,
  };

  return adminPermissionToFcmTopicMapper[resource];
}
