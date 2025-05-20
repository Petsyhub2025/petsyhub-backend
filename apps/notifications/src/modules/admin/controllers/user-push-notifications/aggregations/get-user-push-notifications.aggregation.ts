import { PipelineStage } from 'mongoose';

export function getUserPushNotificationsAggregationPipeline(): PipelineStage[] {
  return [
    {
      $project: {
        _id: 1,
        title: 1,
        body: 1,
        media: 1,
        status: 1,
        scheduledDate: 1,
      },
    },
  ];
}
