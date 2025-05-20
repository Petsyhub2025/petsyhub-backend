export enum PetGenderEnum {
  MALE = 'male',
  FEMALE = 'female',
}

export enum PetAgeUnitEnum {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export enum PetStatusEnum {
  OPEN_FOR_ADOPTION = 'OPEN_FOR_ADOPTION',
  OPEN_FOR_BREEDING = 'OPEN_FOR_BREEDING',
}

export enum PetEventsEnum {
  POST_SAVE_UPDATE_USER_COUNTS = 'pet.post.save.updateUserCounts',
  DELETE_DOC = 'pet.deleteDoc',
  SUSPEND_DOC_DUE_TO_SUSPENSION_AT = 'pet.suspendDocDueToSuspensionAt',
  UN_SUSPEND_DOC_DUE_TO_SUSPENSION_AT = 'pet.unSuspendDocDueToSuspensionAt',
}
