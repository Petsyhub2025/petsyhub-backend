import { Injectable } from '@nestjs/common';
import { DOCUMENTS_COUNT_PER_SYNC_ITERATION } from '@elasticsync/shared-module/config/consts.config';
import { CustomLoggerService } from '@instapets-backend/common';
import { HydratedDocument, Model, PipelineStage } from 'mongoose';

@Injectable()
export class PaginationService {
  private LIMIT = DOCUMENTS_COUNT_PER_SYNC_ITERATION;

  constructor(private readonly logger: CustomLoggerService) {}

  async paginateAggregate<T>(
    model: Model<T>,
    matchStage: PipelineStage[],
    pipeline: PipelineStage[],
    fn: (docs: HydratedDocument<T>[]) => void | Promise<void>,
  ): Promise<void> {
    let page = 1;
    while (true) {
      const docs = (await model.aggregate([
        ...matchStage,
        {
          $skip: (page - 1) * this.LIMIT,
        },
        {
          $limit: this.LIMIT,
        },
        ...pipeline,
      ])) as HydratedDocument<T>[];

      if (!docs.length) {
        //  this.logger.warn(`Couldn't find any more ${model.collection.name} documents in MongoDB`);
        break;
      }

      // this.logger.log(`Found ${docs.length} ${model.collection.name} documents in MongoDB`);

      await fn(docs);

      page++;
    }
  }
}
