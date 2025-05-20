export enum EventTypeEnum {
  FREE = 'FREE',
  PAID = 'PAID',
}

export enum EventStatusEnum {
  ONGOING = 'ONGOING',
  UPCOMING = 'UPCOMING',
  PAST = 'PAST',
  CANCELLED = 'CANCELLED',
}

export enum EventStatusWithoutCancelledEnum {
  ONGOING = 'ONGOING',
  UPCOMING = 'UPCOMING',
  PAST = 'PAST',
}

export enum EventEventListenerTypesEnum {
  DELETE_DOC = 'event.deleteDoc',
  SUSPEND_DOC_DUE_TO_SUSPENSION_AT = 'event.suspendDocDueToSuspensionAt',
  UN_SUSPEND_DOC_DUE_TO_SUSPENSION_AT = 'event.unSuspendDocDueToSuspensionAt',
  SEND_NOTIFICATION = 'event.sendNotification',
}
