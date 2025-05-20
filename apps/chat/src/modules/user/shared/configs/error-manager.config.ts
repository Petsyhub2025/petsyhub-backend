import { CustomError, ErrorType, WsCustomError } from '@instapets-backend/common';

export const httpErrorManager = {
  CANNOT_REQUEST_CHAT_WITH_PUBLIC_USER: new CustomError({
    localizedMessage: {
      en: 'Cannot request chat with public user',
      ar: 'لا يمكن طلب الدردشة مع مستخدم عام',
    },
    event: 'CANNOT_REQUEST_CHAT_WITH_PUBLIC_USER',
  }),
  CHAT_ROOM_ALREADY_EXISTS: new CustomError({
    localizedMessage: {
      en: 'Chat room already exists',
      ar: 'غرفة الدردشة موجودة بالفعل',
    },
    event: 'CHAT_ROOM_ALREADY_EXISTS',
  }),
  CANNOT_REQUEST_CHAT_WITH_SELF: new CustomError({
    localizedMessage: {
      en: 'Cannot request chat with self',
      ar: 'لا يمكن طلب الدردشة مع الذات',
    },
    event: 'CANNOT_REQUEST_CHAT_WITH_SELF',
  }),
  PENDING_REQUEST_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Pending request not found',
      ar: 'الطلب المعلق غير موجود',
    },
    event: 'PENDING_REQUEST_NOT_FOUND',
  }),
  USER_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'User not found',
      ar: 'المستخدم غير موجود',
    },
    event: 'USER_NOT_FOUND',
  }),
  USER_NOT_FOLLOWED: new CustomError({
    localizedMessage: {
      en: 'User not followed',
      ar: 'المستخدم غير متابع',
    },
    event: 'USER_NOT_FOLLOWED',
  }),
  ROOM_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Room not found',
      ar: 'الغرفة غير موجودة',
    },
    event: 'ROOM_NOT_FOUND',
  }),
  PARTICIPANTS_NOT_FOLLOWED_BY_USER: new CustomError({
    localizedMessage: {
      en: 'Participants are not followed by user',
      ar: 'المشاركون غير متابعون من قبل المستخدم',
    },
    event: 'PARTICIPANTS_NOT_FOLLOWED_BY_USER',
  }),
  CANNOT_ADD_SELF_TO_GROUP: new CustomError({
    localizedMessage: {
      en: 'Cannot add self to group',
      ar: 'لا يمكن إضافة الذات إلى المجموعة',
    },
    event: 'CANNOT_ADD_SELF_TO_GROUP',
  }),
  GROUP_CHAT_ROOM_NOT_FOUND: new CustomError({
    localizedMessage: {
      en: 'Group chat room not found',
      ar: 'غرفة دردشة المجموعة غير موجودة',
    },
    event: 'GROUP_CHAT_ROOM_NOT_FOUND',
  }),
  USER_NOT_AUTHORIZED_TO_DO_ACTION: new CustomError({
    localizedMessage: {
      en: 'User not authorized to do action',
      ar: 'المستخدم غير مخول بالقيام بالإجراء',
    },
    event: 'USER_NOT_AUTHORIZED_TO_DO_ACTION',
  }),
  PARTICIPANTS_ALREADY_IN_GROUP: new CustomError({
    localizedMessage: {
      en: 'Participants already in group',
      ar: 'المشاركون موجودون بالفعل في المجموعة',
    },
    event: 'PARTICIPANTS_ALREADY_IN_GROUP',
  }),
  MAX_PARTICIPANTS_REACHED: new CustomError({
    localizedMessage: {
      en: 'Max participants reached',
      ar: 'تم الوصول إلى الحد الأقصى للمشاركين',
    },
    event: 'MAX_PARTICIPANTS_REACHED',
  }),
  CANNOT_REMOVE_SELF_FROM_GROUP: new CustomError({
    localizedMessage: {
      en: 'Cannot remove self from group',
      ar: 'لا يمكن إزالة الذات من المجموعة',
    },
    event: 'CANNOT_REMOVE_SELF_FROM_GROUP',
  }),
  PARTICIPANTS_DO_NOT_EXIST: new CustomError({
    localizedMessage: {
      en: 'Participants do not exist',
      ar: 'المشاركون غير موجودون',
    },
    event: 'PARTICIPANTS_DO_NOT_EXIST',
  }),
  PARTICIPANT_NOT_IN_GROUP: new CustomError({
    localizedMessage: {
      en: 'Participant not in group',
      ar: 'المشارك غير موجود في المجموعة',
    },
    event: 'PARTICIPANT_NOT_IN_GROUP',
  }),
  CANNOT_REMOVE_OWNER: new CustomError({
    localizedMessage: {
      en: 'Cannot remove owner',
      ar: 'لا يمكن إزالة المالك',
    },
    event: 'CANNOT_REMOVE_OWNER',
  }),
  CAN_ONLY_DELETE_GROUP_WITH_ONE_USER: new CustomError({
    localizedMessage: {
      en: 'Can only delete group with one user',
      ar: 'يمكنك فقط حذف المجموعة مع مستخدم واحد',
    },
    event: 'CAN_ONLY_DELETE_GROUP_WITH_ONE_USER',
  }),
  CANNOT_INIT_DIRECT_MESSAGE_WITH_SELF: new CustomError({
    localizedMessage: {
      en: 'Cannot initiate direct message with self',
      ar: 'لا يمكن تهيئة رسالة مباشرة مع الذات',
    },
    event: 'CANNOT_INIT_DIRECT_MESSAGE_WITH_SELF',
  }),
  FILE_EXTENSION_MISSING: new CustomError({
    localizedMessage: {
      en: 'File extension is missing',
      ar: 'مطلوب امتداد الملف',
    },
    event: 'FILE_EXTENSION_REQUIRED',
  }),
  ERROR_WHILE_UPDATING_CHAT_REQUEST_STATUS: new CustomError({
    localizedMessage: {
      en: 'Error while updating chat request status',
      ar: 'خطأ أثناء تحديث حالة طلب الدردشة',
    },
    event: 'ERROR_WHILE_UPDATING_CHAT_REQUEST_STATUS',
  }),
  CANNOT_ACCEPT_OWN_CHAT_REQUEST: new CustomError({
    localizedMessage: {
      en: 'Cannot accept own chat request',
      ar: 'لا يمكن قبول طلب الدردشة الخاص بك',
    },
    event: 'CANNOT_ACCEPT_OWN_CHAT_REQUEST',
  }),
  CANNOT_REJECT_OWN_CHAT_REQUEST: new CustomError({
    localizedMessage: {
      en: 'Cannot reject own chat request',
      ar: 'لا يمكن رفض طلب الدردشة الخاص بك',
    },
    event: 'CANNOT_REJECT_OWN_CHAT_REQUEST',
  }),
};

export const wsErrorManager = {
  USER_NOT_FOUND: new WsCustomError({
    localizedMessage: {
      en: 'User not found',
      ar: 'المستخدم غير موجود',
    },
  }),
  ROOM_NOT_FOUND: new WsCustomError({
    localizedMessage: {
      en: 'Room not found',
      ar: 'الغرفة غير موجودة',
    },
  }),
  PARTICIPANT_NOT_FOUND: new WsCustomError({
    localizedMessage: {
      en: 'Participant not found',
      ar: 'المشارك غير موجود',
    },
  }),
  MESSAGE_NOT_FOUND: new WsCustomError({
    localizedMessage: {
      en: 'Message not found',
      ar: 'الرسالة غير موجودة',
    },
  }),
  MESSAGE_DELETION_THRESHOLD_EXCEEDED: new WsCustomError({
    localizedMessage: {
      en: 'Message deletion threshold exceeded',
      ar: 'تجاوزت عتبة حذف الرسالة',
    },
  }),
  NOT_ALLOWED_TO_SEND_MESSAGE_TO_ROOM: new WsCustomError({
    localizedMessage: {
      en: 'Not allowed to send message to room',
      ar: 'غير مسموح بإرسال رسالة إلى الغرفة',
    },
  }),
  ERROR_WHILE_UPDATING_CHAT_REQUEST_STATUS: new WsCustomError({
    localizedMessage: {
      en: 'Error while updating chat request status',
      ar: 'خطأ أثناء تحديث حالة طلب الدردشة',
    },
  }),
  ERROR_WHILE_CREATING_CHAT_REQUEST: new WsCustomError({
    localizedMessage: {
      en: 'Error while creating chat request',
      ar: 'خطأ أثناء إنشاء طلب الدردشة',
    },
  }),
  NOT_ALLOWED_TO_DELETE_MESSAGE: new WsCustomError({
    localizedMessage: {
      en: 'Not allowed to delete message',
      ar: 'غير مسموح بحذف الرسالة',
    },
  }),
};
