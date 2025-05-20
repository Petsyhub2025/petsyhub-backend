import { BaseIndexHelper, ChangeStreamTokenUtil } from '@elasticsync/admin/shared/helpers';
import { PaginationService } from '@elasticsync/shared-module/utils/pagination.service';
import { CustomLoggerService, ElasticsearchService, ILostPostModel, ModelNames } from '@instapets-backend/common';
import { Inject, Injectable } from '@nestjs/common';
import { PipelineStage, Types } from 'mongoose';
@Injectable()
export class LostPostIndexHelperService extends BaseIndexHelper {
  pipeline: PipelineStage[];
  constructor(
    protected logger: CustomLoggerService,
    protected elasticsearchService: ElasticsearchService,
    protected changeStreamTokenUtil: ChangeStreamTokenUtil,
    private readonly paginationService: PaginationService,
    @Inject(ModelNames.LOST_POST) private lostPostModel: ILostPostModel,
  ) {
    super(changeStreamTokenUtil, logger, elasticsearchService, lostPostModel);
    this.esSchema = {
      authorUser: {
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
      pet: {
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
        },
      },
      locationData: {
        properties: {
          city: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          country: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
        },
      },
      description: {
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
      isFound: {
        type: 'boolean',
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
          let: { userId: '$authorUser' },
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
          as: 'authorUser',
        },
      },
      { $unwind: { path: '$authorUser', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'pets',
          let: { petId: '$pet' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', { $ifNull: ['$$petId', null] }] } } },
            {
              $project: {
                _id: 1,
                name: 1,
              },
            },
          ],
          as: 'pet',
        },
      },
      { $unwind: { path: '$pet', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          deletedAt: 1,
          isViewable: 1,
          _id: 1,
          authorUser: 1,
          description: 1,
          pet: 1,
          locationData: {
            city: 1,
            country: 1,
          },
          isFound: 1,
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

    await this.paginationService.paginateAggregate(this.lostPostModel, matchStage, this.pipeline, async (docs) => {
      await this.synchronizeDocument(docs);
    });
  }

  async syncUserUpdates(userId: string) {
    const matchStage: PipelineStage[] = [
      {
        $match: {
          authorUser: new Types.ObjectId(userId),
        },
      },
    ];

    await this.paginationService.paginateAggregate(this.lostPostModel, matchStage, this.pipeline, async (docs) => {
      await this.synchronizeDocument(docs);
    });
  }

  async syncPetUpdates(petId: string) {
    const matchStage: PipelineStage[] = [
      {
        $match: {
          pet: new Types.ObjectId(petId),
        },
      },
    ];

    await this.paginationService.paginateAggregate(this.lostPostModel, matchStage, this.pipeline, async (docs) => {
      await this.synchronizeDocument(docs);
    });
  }
}
