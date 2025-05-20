import { BaseIndexHelper, ChangeStreamTokenUtil } from '@elasticsync/admin/shared/helpers';
import { PaginationService } from '@elasticsync/shared-module/utils/pagination.service';
import {
  CustomLoggerService,
  ElasticsearchService,
  IUserPushNotificationModel,
  ModelNames,
} from '@instapets-backend/common';
import { Inject, Injectable } from '@nestjs/common';
import { PipelineStage, Types } from 'mongoose';

@Injectable()
export class UserPushNotificationsIndexHelperService extends BaseIndexHelper {
  pipeline: PipelineStage[];
  constructor(
    protected logger: CustomLoggerService,
    protected elasticsearchService: ElasticsearchService,
    protected readonly changeStreamTokenUtil: ChangeStreamTokenUtil,
    private readonly paginationService: PaginationService,
    @Inject(ModelNames.USER_PUSH_NOTIFICATION) private userPushNotificationModel: IUserPushNotificationModel,
  ) {
    super(changeStreamTokenUtil, logger, elasticsearchService, userPushNotificationModel);
    this.esSchema = {
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
      isArchived: {
        type: 'boolean',
      },
    };
    this.pipeline = [
      {
        $project: {
          deletedAt: 1,
          _id: 1,
          isArchived: 1,
          name: 1,
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
      this.userPushNotificationModel,
      matchStage,
      this.pipeline,
      async (docs) => {
        await this.synchronizeDocument(docs);
      },
    );
  }
}
