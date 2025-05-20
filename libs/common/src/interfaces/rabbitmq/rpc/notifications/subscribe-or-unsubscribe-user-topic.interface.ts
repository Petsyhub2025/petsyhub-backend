import { UserFcmTopicsEnum } from '@common/enums';

interface IBaseSubscribeOrUnsubscribeUserTopicRpc {
  topic: UserFcmTopicsEnum;
  fcmToken?: string;
  fcmTokens?: string[];
}

interface ISingleSubscribeOrUnsubscribeUserTopicRpc extends IBaseSubscribeOrUnsubscribeUserTopicRpc {
  fcmToken: string;
  fcmTokens?: never;
}

interface IMultiSubscribeOrUnsubscribeUserTopicRpc extends IBaseSubscribeOrUnsubscribeUserTopicRpc {
  fcmToken?: never;
  fcmTokens: string[];
}

export type ISubscribeUserToTopicRpc =
  | ISingleSubscribeOrUnsubscribeUserTopicRpc
  | IMultiSubscribeOrUnsubscribeUserTopicRpc;

export type IUnsubscribeUserFromTopicRpc =
  | ISingleSubscribeOrUnsubscribeUserTopicRpc
  | IMultiSubscribeOrUnsubscribeUserTopicRpc;
