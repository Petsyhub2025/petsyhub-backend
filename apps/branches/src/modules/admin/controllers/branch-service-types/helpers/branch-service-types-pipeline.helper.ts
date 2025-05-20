import { PipelineStage } from 'mongoose';

export function getTypesPipeline(): PipelineStage[] {
  return [
    {
      $project: { _id: 1, name: 1, color: 1, typePictureMedia: 1, branchType: 1 },
    },
  ];
}
