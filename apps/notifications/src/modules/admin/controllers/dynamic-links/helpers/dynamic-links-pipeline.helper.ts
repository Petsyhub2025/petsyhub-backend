import { PipelineStage } from 'mongoose';

export function getDynamicLinksPipeline(): PipelineStage[] {
  return [
    {
      $project: {
        deepLink: 1,
        dynamicLink: 1,
        linkedTo: 1,
        previewDescription: 1,
        previewMedia: 1,
        previewTitle: 1,
        title: 1,
        isArchived: 1,
      },
    },
  ];
}
