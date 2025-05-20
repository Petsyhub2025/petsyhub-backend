import { PipelineStage } from 'mongoose';

export function getAreasPipeline(): PipelineStage[] {
  return [
    {
      $project: { _id: 1, name: 1 },
    },
  ];
}
