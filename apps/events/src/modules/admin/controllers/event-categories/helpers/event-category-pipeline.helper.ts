import { PipelineStage } from 'mongoose';

export function getEventCategoryPipeline(): PipelineStage[] {
  return [
    {
      $project: { _id: 1, name: 1 },
    },
  ];
}
