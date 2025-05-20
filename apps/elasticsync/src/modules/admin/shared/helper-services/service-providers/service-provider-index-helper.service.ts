import { BaseIndexHelper, ChangeStreamTokenUtil } from '@elasticsync/admin/shared/helpers';
import { Inject, Injectable } from '@nestjs/common';
import { PaginationService } from '@elasticsync/shared-module/utils/pagination.service';
import {
  CustomLoggerService,
  ElasticsearchService,
  IServiceProviderModel,
  ModelNames,
} from '@instapets-backend/common';
import { PipelineStage, Types } from 'mongoose';

@Injectable()
export class ServiceProviderIndexHelperService extends BaseIndexHelper {
  pipeline: PipelineStage[];
  constructor(
    protected logger: CustomLoggerService,
    protected elasticsearchService: ElasticsearchService,
    protected readonly changeStreamTokenUtil: ChangeStreamTokenUtil,
    private readonly paginationService: PaginationService,
    @Inject(ModelNames.SERVICE_PROVIDER)
    private serviceProviderModel: IServiceProviderModel,
  ) {
    super(changeStreamTokenUtil, logger, elasticsearchService, serviceProviderModel);
    this.esSchema = {
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
      email: {
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
        $project: {
          deletedAt: 1,
          isViewable: 1,
          _id: 1,
          fullName: 1,
          email: 1,
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
      this.serviceProviderModel,
      matchStage,
      this.pipeline,
      async (docs) => {
        await this.synchronizeDocument(docs);
      },
    );
  }
}
