export enum UserGenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  RATHER_NOT_SAY = 'RATHER_NOT_SAY',
}

export enum UserEventsEnum {
  DELETE_DOC = 'user.deleteDoc',
  SUSPEND_DOC = 'user.suspendDoc',
  UN_SUSPEND_DOC = 'user.unSuspendDoc',
}

export enum UserRoleEnum {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BLOCKED = 'BLOCKED',
}

export enum BlockedReasonEnum {
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  SPAM = 'SPAM',
  INAPPROPRIATE_NAME = 'INAPPROPRIATE_NAME',
}

export enum UserSocketStatusEnum {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}
