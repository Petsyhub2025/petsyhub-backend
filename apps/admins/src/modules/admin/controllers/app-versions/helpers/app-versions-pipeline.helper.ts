import { PipelineStage } from 'mongoose';

export function getAppVersionsPipeline(): PipelineStage[] {
  return [
    {
      $project: { _id: 1, backendVersions: 1, androidVersion: 1, iosVersion: 1, isDeprecated: 1, versionType: 1 },
    },
  ];
}
