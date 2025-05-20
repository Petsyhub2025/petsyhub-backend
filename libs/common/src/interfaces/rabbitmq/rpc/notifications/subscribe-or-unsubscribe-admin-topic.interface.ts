import { AdminFcmTopicsEnum } from '@common/enums';

interface IBaseSubscribeOrUnsubscribeAdminTopicRpc {
  topic: AdminFcmTopicsEnum;
  fcmToken?: string;
  fcmTokens?: string[];
}

interface ISingleSubscribeOrUnsubscribeAdminTopicRpc extends IBaseSubscribeOrUnsubscribeAdminTopicRpc {
  fcmToken: string;
  fcmTokens?: never;
}

interface IMultiSubscribeOrUnsubscribeAdminTopicRpc extends IBaseSubscribeOrUnsubscribeAdminTopicRpc {
  fcmToken?: never;
  fcmTokens: string[];
}

export type ISubscribeAdminToTopicRpc =
  | ISingleSubscribeOrUnsubscribeAdminTopicRpc
  | IMultiSubscribeOrUnsubscribeAdminTopicRpc;

export type IUnsubscribeAdminFromTopicRpc =
  | ISingleSubscribeOrUnsubscribeAdminTopicRpc
  | IMultiSubscribeOrUnsubscribeAdminTopicRpc;
