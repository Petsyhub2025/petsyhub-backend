import { PipelineStage } from 'mongoose';

export function getTopicsPipeline(viewerId?: string): PipelineStage[] {
  return [
    {
      $unwind: {
        path: '$topics',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'topics',
        let: { topicId: '$topics' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$topicId'],
              },
            },
          },
          {
            $project: {
              name: 1,
            },
          },
        ],
        as: 'topics',
      },
    },
    {
      $unwind: {
        path: '$topics',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$_id',
        root: {
          $first: '$$ROOT',
        },
        topics: {
          $push: '$topics',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$root', { topics: '$topics' }],
        },
      },
    },
  ];
}
