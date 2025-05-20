import { PipelineStage } from 'mongoose';

export function getEventFacilityPipeline(): PipelineStage[] {
  return [
    {
      $project: { _id: 1, name: 1 },
    },
  ];
}
