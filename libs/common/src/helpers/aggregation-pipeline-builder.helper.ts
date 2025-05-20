import { PipelineStage, Types } from 'mongoose';

export class AggregationPipelineBuilder {
  private pipeline: PipelineStage[] = [];

  constructor() {}

  addStages(...stages: PipelineStage[]): AggregationPipelineBuilder {
    this.pipeline.push(...stages);
    return this;
  }

  addLimit(limit: number): AggregationPipelineBuilder {
    if (limit <= 0) return this;
    this.pipeline.push({ $limit: limit });
    return this;
  }

  addPagination({ page, limit }: { page: number; limit: number }): AggregationPipelineBuilder {
    if (limit <= 0) return this;
    this.pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });
    return this;
  }

  addSorting(sort: { [key: string]: 1 | -1 }): AggregationPipelineBuilder {
    this.pipeline.push({ $sort: sort });
    return this;
  }

  addMaintainOrderStages({
    indexField = '_id',
    input,
  }: {
    indexField?: string;
    input: (Types.ObjectId | string)[];
  }): AggregationPipelineBuilder {
    this.pipeline.push(
      {
        $addFields: {
          __order: {
            $indexOfArray: [input.map((val) => new Types.ObjectId(val)), `$${indexField}`],
          },
        },
      },
      {
        $sort: {
          __order: 1,
        },
      },
    );
    return this;
  }

  build(): PipelineStage[] {
    return this.pipeline;
  }
}
