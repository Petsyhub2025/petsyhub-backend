import { PipelineStage } from 'mongoose';

export function getTypesPipeline(): PipelineStage[] {
  return [
    {
      $project: { _id: 1, name: 1 },
    },
  ];
}
