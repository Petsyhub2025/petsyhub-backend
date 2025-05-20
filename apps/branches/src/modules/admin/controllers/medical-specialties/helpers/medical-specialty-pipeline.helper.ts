import { PipelineStage } from 'mongoose';

export function getMedicalSpecialtiesPipeline(): PipelineStage[] {
  return [
    {
      $project: { _id: 1, name: 1, branchType: 1 },
    },
  ];
}
