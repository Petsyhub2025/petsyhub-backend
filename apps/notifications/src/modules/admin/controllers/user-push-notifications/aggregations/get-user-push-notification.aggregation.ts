import { PipelineStage } from 'mongoose';

export function getUserPushNotificationAggregationPipeline(): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'dynamiclinks',
        let: { dynamicLinkId: '$dynamicLinkId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$dynamicLinkId', null] }],
              },
            },
          },
          {
            $project: {
              _id: 1,
              dynamicLink: 1,
            },
          },
        ],
        as: 'dynamicLink',
      },
    },
    {
      $unwind: {
        path: '$dynamicLink',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: '$userSegments',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'usersegments',
        let: { userSegmentId: '$userSegments' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$userSegmentId', null] }],
              },
            },
          },
          {
            $project: {
              _id: 1,
              title: 1,
            },
          },
        ],
        as: 'userSegments',
      },
    },
    {
      $unwind: {
        path: '$userSegments',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$_id',
        doc: {
          $first: '$$ROOT',
        },
        userSegments: {
          $push: '$userSegments',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$doc',
            {
              userSegments: '$userSegments',
            },
          ],
        },
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        body: 1,
        media: 1,
        status: 1,
        scheduleDate: 1,
        dynamicLink: 1,
        includeAllUsers: 1,
        userSegments: 1,
        cancelledAt: 1,
        cancellationReason: 1,
        createdAt: 1,
        updatedAt: 1,
        scheduledDate: 1,
      },
    },
  ];
}
