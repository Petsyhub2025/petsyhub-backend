import { Injectable } from '@nestjs/common';
import { CustomLoggerService } from '@instapets-backend/common';
import { FilterQuery, Model, PipelineStage } from 'mongoose';

@Injectable()
export class PaginationService {
  private LIMIT = 100000;

  constructor(private readonly logger: CustomLoggerService) {}

  async paginateFind<T>(
    model: Model<T>,
    query: FilterQuery<T>,
    fn: (docs: Hydrate<T>[]) => void | Promise<void>,
  ): Promise<void> {
    let page = 1;
    while (true) {
      const docs = (await model
        .find(query ?? {})
        .skip((page - 1) * this.LIMIT)
        .limit(this.LIMIT)
        .lean()) as Hydrate<T>[];

      if (!docs.length) {
        this.logger.warn(`Couldn't find any more ${model.modelName} documents in MongoDB`);
        break;
      }

      this.logger.log(`Found ${docs.length} ${model.modelName} documents in MongoDB`);

      await fn(docs);

      page++;
    }
  }

  async paginateAggregate<T>(
    model: Model<T>,
    matchStage: PipelineStage.Match,
    pipeline: PipelineStage[],
    fn: (docs: Hydrate<T>[]) => void | Promise<void>,
  ): Promise<void> {
    let page = 1;
    while (true) {
      const docs = (await model.aggregate([
        {
          ...matchStage,
        },
        { $skip: (page - 1) * this.LIMIT },
        { $limit: this.LIMIT },
        ...pipeline,
      ])) as Hydrate<T>[];

      if (!docs.length) {
        this.logger.warn(`Couldn't find any more ${model.modelName} documents in MongoDB`);
        break;
      }

      this.logger.log(`Found ${docs.length} ${model.modelName} documents in MongoDB`);

      await fn(docs);

      page++;
    }
  }
}
