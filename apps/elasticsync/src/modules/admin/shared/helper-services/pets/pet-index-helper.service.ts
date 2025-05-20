import { BaseIndexHelper, ChangeStreamTokenUtil } from '@elasticsync/admin/shared/helpers';
import { PaginationService } from '@elasticsync/shared-module/utils/pagination.service';
import { CustomLoggerService, ElasticsearchService, IPetModel, ModelNames } from '@instapets-backend/common';
import { Inject, Injectable } from '@nestjs/common';
import { PipelineStage, Types } from 'mongoose';
import { LostPostIndexHelperService } from '@elasticsync/admin/shared/helper-services/lost-found-posts';
import { PetFollowsIndexHelperService } from '@elasticsync/admin/shared/helper-services/pet-follows';
import { PostIndexHelperService } from '@elasticsync/admin/shared/helper-services/posts';

@Injectable()
export class PetIndexHelperService extends BaseIndexHelper {
  pipeline: PipelineStage[];
  constructor(
    protected logger: CustomLoggerService,
    protected elasticsearchService: ElasticsearchService,
    protected readonly changeStreamTokenUtil: ChangeStreamTokenUtil,
    private readonly paginationService: PaginationService,
    @Inject(ModelNames.PET) private petModel: IPetModel,
    //dependent models
    private readonly postIndexHelperService: PostIndexHelperService,
    private readonly petFollowsIndexHelperService: PetFollowsIndexHelperService,
    private readonly lostPostIndexHelperService: LostPostIndexHelperService,
  ) {
    super(changeStreamTokenUtil, logger, elasticsearchService, petModel);
    this.esSchema = {
      user: {
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
      breed: {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      },
      type: {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      },
      name: {
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
      isViewable: {
        type: 'boolean',
      },
    };
    this.pipeline = [
      {
        $lookup: {
          from: 'users',
          let: { userId: '$user.userId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', { $ifNull: ['$$userId', null] }] } } },
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
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          deletedAt: 1,
          isViewable: 1,
          _id: 1,
          name: 1,
          user: 1,
          breed: 1,
          type: 1,
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

    await this.paginationService.paginateAggregate(this.petModel, matchStage, this.pipeline, async (docs) => {
      await this.synchronizeDocument(docs);
    });
  }

  async syncUserUpdates(userId: string) {
    const matchStage: PipelineStage[] = [
      {
        $match: {
          'user.userId': new Types.ObjectId(userId),
        },
      },
    ];

    await this.paginationService.paginateAggregate(this.petModel, matchStage, this.pipeline, async (docs) => {
      await this.synchronizeDocument(docs);
    });
  }

  syncDependencies(_id: string) {
    return Promise.all([
      this.postIndexHelperService.syncPetUpdates(_id),
      this.petFollowsIndexHelperService.syncPetUpdates(_id),
      this.lostPostIndexHelperService.syncPetUpdates(_id),
    ]);
  }
}
