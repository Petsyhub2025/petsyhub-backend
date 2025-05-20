import { PipelineStage } from 'mongoose';

export function getServiceProvidersPipeline(): PipelineStage[] {
  return [
    {
      $project: {
        _id: 1,
        fullName: 1,
        email: 1,
        phoneNumber: 1,
      },
    },
  ];
}
