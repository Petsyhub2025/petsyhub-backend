import { CustomError, ErrorType } from '@instapets-backend/common';

export const errorManager = {
  POST_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Post not found',
      ar: 'المنشور غير موجود',
    },
    event: 'POST_NOT_FOUND',
  }),
  PET_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Pet not found',
      ar: 'الحيوان الأليف غير موجود',
    },
    event: 'PET_NOT_FOUND',
  }),
  USER_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'User not found',
      ar: 'المستخدم غير موجود',
    },
    event: 'USER_NOT_FOUND',
  }),
  COULD_NOT_GENERATE_EXPLORE_POSTS: new CustomError({
    localizedMessage: {
      en: 'Could not generate explore posts',
      ar: 'تعذر إنشاء منشورات الاستكشاف',
    },
    event: 'COULD_NOT_GENERATE_EXPLORE_POSTS',
  }),
  TAGGED_USERS_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Tagged users not found',
      ar: 'المستخدمين المعنيين غير موجودين',
    },
    event: 'TAGGED_USERS_NOT_FOUND',
  }),
  TAGGED_USERS_SELF_TAGGED: new CustomError({
    localizedMessage: {
      en: 'You cannot tag yourself',
      ar: 'لا يمكنك وسم نفسك',
    },
    event: 'TAGGED_USERS_SELF_TAGGED',
  }),
  TAGGED_USERS_DUPLICATED: new CustomError({
    localizedMessage: {
      en: 'Tagged users duplicated',
      ar: 'المستخدمين المعنيين مكررين',
    },
    event: 'TAGGED_USERS_DUPLICATED',
  }),
  TAGGED_PETS_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Tagged pets not found',
      ar: 'الحيوانات الأليفة المعنية غير موجودة',
    },
    event: 'TAGGED_PETS_NOT_FOUND',
  }),
  TAGGED_PETS_DUPLICATED: new CustomError({
    localizedMessage: {
      en: 'Tagged pets duplicated',
      ar: 'الحيوانات الأليفة المعنية مكررة',
    },
    event: 'TAGGED_PETS_DUPLICATED',
  }),
  CANNOT_TAG_NON_FOLLOWED_USERS: new CustomError({
    localizedMessage: {
      en: 'Cannot tag non-followed users',
      ar: 'لا يمكن وسم المستخدمين غير المتابعين',
    },
    event: 'CANNOT_TAG_NON_FOLLOWED_USERS',
  }),
  CANNOT_TAG_NON_FOLLOWED_OR_OWNED_PETS: new CustomError({
    localizedMessage: {
      en: 'Cannot tag non-followed pets or pets not owned by you',
      ar: 'لا يمكن وسم الحيوانات الأليفة غير المتابعة أو الحيوانات الأليفة التي لا تملكها',
    },
    event: 'CANNOT_TAG_NON_FOLLOWED_PETS',
  }),
  TOPIC_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Topic not found',
      ar: 'الموضوع غير موجود',
    },
    event: 'TOPIC_NOT_FOUND',
    errorType: ErrorType.NOT_FOUND,
  }),
  TOPICS_DUPLICATED: new CustomError({
    localizedMessage: {
      en: 'Selected topics are duplicated',
      ar: 'المواضيع المختارة متكررة',
    },
    event: 'TOPICS_DUPLICATED',
    errorType: ErrorType.CONFLICT,
  }),
};
