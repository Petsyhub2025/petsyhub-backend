import { BaseIndexHelper, ChangeStreamTokenUtil } from '@elasticsync/admin/shared/helpers';
import { Inject, Injectable } from '@nestjs/common';
import { PaginationService } from '@elasticsync/shared-module/utils/pagination.service';
import { CustomLoggerService, ElasticsearchService, IUserFollowModel, ModelNames } from '@instapets-backend/common';
import { PipelineStage, Types } from 'mongoose';

@Injectable()
export class UserFollowsIndexHelperService extends BaseIndexHelper {
  pipeline: PipelineStage[];
  constructor(
    protected logger: CustomLoggerService,
    protected elasticsearchService: ElasticsearchService,
    protected readonly changeStreamTokenUtil: ChangeStreamTokenUtil,
    private readonly paginationService: PaginationService,
    @Inject(ModelNames.USER_FOLLOW) private userFollowModel: IUserFollowModel,
  ) {
    super(changeStreamTokenUtil, logger, elasticsearchService, userFollowModel);
    this.esSchema = {
      follower: {
        properties: {
          _id: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          fullName: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
              sayt: {
                type: 'search_as_you_type',
              },
            },
          },
          username: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
              sayt: {
                type: 'search_as_you_type',
              },
            },
          },
        },
      },
      following: {
        properties: {
          _id: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          fullName: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
              sayt: {
                type: 'search_as_you_type',
              },
            },
          },
          username: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
              sayt: {
                type: 'search_as_you_type',
              },
            },
          },
        },
      },
      createdAt: {
        type: 'date',
      },
      isViewable: {
        type: 'boolean',
      },
    };
    this.pipeline = [
      {
        $lookup: {
          from: 'users',
          let: { following: '$following' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$following'],
                },
              },
            },
            {
              $project: {
                _id: 1,
                fullName: {
                  $concat: [
                    { $ifNull: ['$firstName', ''] },
                    {
                      $cond: {
                        if: {
                          $and: [{ $gt: ['$lastName', null] }, { $gt: ['$firstName', null] }],
                        },
                        then: ' ',
                        else: '',
                      },
                    },
                    { $ifNull: ['$lastName', ''] },
                  ],
                },
                username: 1,
              },
            },
          ],
          as: 'following',
        },
      },
      {
        $unwind: {
          path: '$following',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { follower: '$follower' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$follower'],
                },
              },
            },
            {
              $project: {
                _id: 1,
                fullName: {
                  $concat: [
                    { $ifNull: ['$firstName', ''] },
                    {
                      $cond: {
                        if: {
                          $and: [{ $gt: ['$lastName', null] }, { $gt: ['$firstName', null] }],
                        },
                        then: ' ',
                        else: '',
                      },
                    },
                    { $ifNull: ['$lastName', ''] },
                  ],
                },
                username: 1,
              },
            },
          ],
          as: 'follower',
        },
      },
      {
        $unwind: {
          path: '$follower',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          deletedAt: 1,
          isViewable: 1,
          _id: 1,
          follower: 1,
          following: 1,
          createdAt: 1,
        },
      },
    ];
  }

  async migrate() {
    await this.syncCollection();
    this.logger.log(`${this.indexName} has been created successfully`);
  }

  async syncCollection(_ids: string[] = []) {
    const matchStage: PipelineStage[] = _ids?.length
      ? [{ $match: { _id: { $in: _ids.map((_id) => new Types.ObjectId(_id)) } } }]
      : [{ $match: {} }];

    await this.paginationService.paginateAggregate(this.userFollowModel, matchStage, this.pipeline, async (docs) => {
      await this.synchronizeDocument(docs);
    });
  }

  async syncUserUpdates(userId: string) {
    const matchStage: PipelineStage[] = [
      {
        $match: {
          $or: [
            {
              follower: new Types.ObjectId(userId),
            },
            {
              following: new Types.ObjectId(userId),
            },
          ],
        },
      },
    ];

    await this.paginationService.paginateAggregate(this.userFollowModel, matchStage, this.pipeline, async (docs) => {
      await this.synchronizeDocument(docs);
    });
  }
}
