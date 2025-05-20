import { BaseSearchPaginationQuery } from '@common/dtos';

export class UserPushNotificationAdminRpcPayload extends BaseSearchPaginationQuery {
  userSegmentId?: string;
  dynamicLinkId?: string;
}
