import { PipelineStage, Types } from 'mongoose';

export function addPaginationStages({ limit, page }: { page: number; limit: number }): PipelineStage[] {
  const skip = (page - 1) * limit;
  return [
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ];
}

export function addMaintainOrderStages({
  indexField = '_id',
  input,
}: {
  indexField?: string;
  input: Types.ObjectId[];
}): PipelineStage[] {
  return [
    {
      $addFields: {
        __order: {
          $indexOfArray: [input, `$${indexField}`],
        },
      },
    },
    {
      $sort: {
        __order: 1,
      },
    },
  ];
}
