import { BaseIndexHelper, ChangeStreamTokenUtil } from '@elasticsync/admin/shared/helpers';
import { Inject, Injectable } from '@nestjs/common';
import { PaginationService } from '@elasticsync/shared-module/utils/pagination.service';
import { CustomLoggerService, ElasticsearchService, ICityModel, ModelNames } from '@instapets-backend/common';
import { PipelineStage, Types } from 'mongoose';

@Injectable()
export class CityIndexHelperService extends BaseIndexHelper {
  pipeline: PipelineStage[];
  constructor(
    protected logger: CustomLoggerService,
    protected elasticsearchService: ElasticsearchService,
    protected readonly changeStreamTokenUtil: ChangeStreamTokenUtil,
    private readonly paginationService: PaginationService,
    @Inject(ModelNames.CITY) private cityModel: ICityModel,
  ) {
    super(changeStreamTokenUtil, logger, elasticsearchService, cityModel);
    this.esSchema = {
      name: {
        properties: {
          en: {
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
          ar: {
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
      country: {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      },
      isViewable: {
        type: 'boolean',
      },
    };
    this.pipeline = [
      {
        $project: {
          deletedAt: 1,
          isViewable: 1,
          _id: 1,
          name: 1,
          country: 1,
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

    await this.paginationService.paginateAggregate(this.cityModel, matchStage, this.pipeline, async (docs) => {
      await this.synchronizeDocument(docs);
    });
  }
}
