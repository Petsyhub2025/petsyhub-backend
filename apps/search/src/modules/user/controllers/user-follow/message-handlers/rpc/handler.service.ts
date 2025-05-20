import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';
import {
  EsModelNames,
  ISearchResponseData,
  RpcResponse,
  UserFollowEsFieldsEnum,
  UserFollowEsSaytFieldsEnum,
  UserFollowersRpcPayload,
  UserFollowingRpcPayload,
} from '@instapets-backend/common';

@Injectable()
export class UserFollowsRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getUserFollowersSearchData({
    page,
    limit,
    search,
    recent,
    userId,
    targetUserId,
  }: UserFollowersRpcPayload): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.USER_FOLLOW,
        filters: [
          {
            term: {
              'following._id': targetUserId || userId,
            },
          },
          {
            term: {
              isViewable: true,
            },
          },
          ...(recent
            ? [
                {
                  range: {
                    createdAt: {
                      gte: 'now-90d',
                    },
                  },
                },
              ]
            : []),
        ],
        query: search,
        searchableFields: [`${UserFollowEsFieldsEnum.FollowerFullName}^2`, UserFollowEsFieldsEnum.FollowerUsername],
        saytFields: [`${UserFollowEsSaytFieldsEnum.FollowerFullName}^2`, UserFollowEsSaytFieldsEnum.FollowerUsername],
        page,
        limit,
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

  async getUserFollowingsSearchData({
    page,
    limit,
    search,
    userId,
    targetUserId,
  }: UserFollowingRpcPayload): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.USER_FOLLOW,
        filters: [
          {
            term: {
              'follower._id': targetUserId || userId,
            },
          },
          {
            term: {
              isViewable: true,
            },
          },
        ],
        query: search,
        searchableFields: [`${UserFollowEsFieldsEnum.FollowingFullName}^2`, UserFollowEsFieldsEnum.FollowingUsername],
        saytFields: [`${UserFollowEsSaytFieldsEnum.FollowingFullName}^2`, UserFollowEsSaytFieldsEnum.FollowingUsername],
        page,
        limit,
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
}
