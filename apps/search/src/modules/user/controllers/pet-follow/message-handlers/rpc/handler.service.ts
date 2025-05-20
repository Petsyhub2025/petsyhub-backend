import { Injectable } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';
import {
  EsModelNames,
  FollowedPetsUserRpcPayload,
  ISearchResponseData,
  PetFollowEsFieldsEnum,
  PetFollowEsSaytFieldsEnum,
  RpcResponse,
  UserFollowedPetsRpcPayload,
} from '@instapets-backend/common';

@Injectable()
export class PetFollowsRpcHandlerService {
  constructor(private readonly elasticSearchHelperService: ElasticSearchHelperService) {}

  async getPetFollowersSearchData({
    page,
    limit,
    search,
    recent,
    petId,
  }: UserFollowedPetsRpcPayload): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.PET_FOLLOW,
        filters: [
          ...(petId
            ? [
                {
                  term: {
                    'following._id': petId,
                  },
                },
              ]
            : []),
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
          {
            term: {
              isViewable: true,
            },
          },
        ],
        query: search,
        searchableFields: [`${PetFollowEsFieldsEnum.FollowerFullName}^2`, PetFollowEsFieldsEnum.FollowerUsername],
        saytFields: [`${PetFollowEsSaytFieldsEnum.FollowerFullName}^2`, PetFollowEsSaytFieldsEnum.FollowerUsername],
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

  async getFollowedPetsSearchData({
    page,
    limit,
    search,
    userId,
    targetUserId,
    excludePetId,
  }: FollowedPetsUserRpcPayload): Promise<RpcResponse<ISearchResponseData>> {
    {
      const searches = await this.elasticSearchHelperService.matchQuery({
        index: EsModelNames.PET_FOLLOW,
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
          ...(excludePetId
            ? [
                {
                  bool: {
                    must_not: [
                      {
                        term: {
                          'following._id': excludePetId,
                        },
                      },
                    ],
                  },
                },
              ]
            : []),
        ],
        query: search,
        searchableFields: [PetFollowEsFieldsEnum.FollowingName],
        saytFields: [PetFollowEsSaytFieldsEnum.FollowingName],
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
