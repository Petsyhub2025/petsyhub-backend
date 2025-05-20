import {
  EsModelNames,
  ISearchResponseData,
  RpcResponse,
  UserPushNotificationAdminRpcPayload,
  UserPushNotificationEsFieldsEnum,
  UserPushNotificationEsSaytFieldsEnum,
} from '@instapets-backend/common';
import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';

@Injectable()
export class UserPushNotificationsRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getUserPushNotificationsSearchData(
    payload: UserPushNotificationAdminRpcPayload,
  ): Promise<RpcResponse<ISearchResponseData>> {
    const { page, limit, search, dynamicLinkId, userSegmentId } = payload;

    const searches = await this.elasticSearchHelperService.matchQuery({
      index: EsModelNames.USER_PUSH_NOTIFICATION,
      query: search,
      searchableFields: [`${UserPushNotificationEsFieldsEnum.name}`],
      saytFields: [`${UserPushNotificationEsSaytFieldsEnum.name}`],
      page,
      limit,
      accurateCount: true,
      filters: [
        ...(dynamicLinkId
          ? [
              {
                term: {
                  dynamicLinkId: dynamicLinkId,
                },
              },
            ]
          : []),
        ...(userSegmentId
          ? [
              {
                terms: {
                  userSegments: [userSegmentId],
                },
              },
            ]
          : []),
      ],
    });

    const total = searches?.total;
    const totalValue = typeof total === 'number' ? total : total?.value || 0;
    const _ids = searches?.hits ? searches.hits.map((value) => value._id) : [];

    return RpcResponse.success({
      _ids,
      limit,
      page,
      total: totalValue,
      pages: Math.ceil(totalValue / limit),
    });
  }
}
