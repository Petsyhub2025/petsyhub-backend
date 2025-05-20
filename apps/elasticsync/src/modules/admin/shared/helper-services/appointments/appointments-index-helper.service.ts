import { BaseIndexHelper, ChangeStreamTokenUtil } from '@elasticsync/admin/shared/helpers';
import { PaginationService } from '@elasticsync/shared-module/utils/pagination.service';
import {
  CustomLoggerService,
  ElasticsearchService,
  IBaseAppointmentModel,
  ModelNames,
} from '@instapets-backend/common';
import { Inject, Injectable } from '@nestjs/common';
import { PipelineStage, Types } from 'mongoose';

@Injectable()
export class AppointmentsIndexHelperService extends BaseIndexHelper {
  pipeline: PipelineStage[];
  constructor(
    protected logger: CustomLoggerService,
    protected elasticsearchService: ElasticsearchService,
    protected readonly changeStreamTokenUtil: ChangeStreamTokenUtil,
    private readonly paginationService: PaginationService,
    @Inject(ModelNames.BASE_APPOINTMENT)
    private baseAppointmentModel: IBaseAppointmentModel,
  ) {
    super(changeStreamTokenUtil, logger, elasticsearchService, baseAppointmentModel);
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
      selectedPet: {
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
      branch: {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      },
      status: {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      },
      county: {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      },
      city: {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      },
      area: {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      },
      date: {
        type: 'date',
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
          let: { userId: '$user' },
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
        $lookup: {
          from: 'pets',
          let: { petId: '$selectedPet' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $ifNull: ['$$petId', null] }],
                },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
              },
            },
          ],
          as: 'selectedPet',
        },
      },
      {
        $unwind: {
          path: '$selectedPet',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          deletedAt: 1,
          isViewable: 1,
          _id: 1,
          user: 1,
          selectedPet: 1,
          branch: 1,
          status: 1,
          county: 1,
          city: 1,
          area: 1,
          date: 1,
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

    await this.paginationService.paginateAggregate(
      this.baseAppointmentModel,
      matchStage,
      this.pipeline,
      async (docs) => {
        await this.synchronizeDocument(docs);
      },
    );
  }

  async syncUserUpdates(userId: string) {
    const matchStage: PipelineStage[] = [
      {
        $match: {
          user: new Types.ObjectId(userId),
        },
      },
    ];

    await this.paginationService.paginateAggregate(
      this.baseAppointmentModel,
      matchStage,
      this.pipeline,
      async (docs) => {
        await this.synchronizeDocument(docs);
      },
    );
  }
}
