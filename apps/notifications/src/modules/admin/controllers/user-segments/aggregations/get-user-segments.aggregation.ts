import { PipelineStage } from 'mongoose';

export function getUserSegmentsAggregationPipeLine(): PipelineStage[] {
  return [
    {
      $addFields: {
        devices: {
          android: {
            $cond: {
              if: { $ifNull: ['$devices.android', false] },
              then: {
                min: {
                  $cond: {
                    if: { $ifNull: ['$devices.android.min', false] },
                    then: {
                      $concat: [
                        { $toString: '$devices.android.min.major' },
                        '.',
                        { $toString: '$devices.android.min.minor' },
                        '.',
                        { $toString: '$devices.android.min.patch' },
                      ],
                    },
                    else: '$$REMOVE',
                  },
                },
                max: {
                  $cond: {
                    if: { $ifNull: ['$devices.android.max', false] },
                    then: {
                      $concat: [
                        { $toString: '$devices.android.max.major' },
                        '.',
                        { $toString: '$devices.android.max.minor' },
                        '.',
                        { $toString: '$devices.android.max.patch' },
                      ],
                    },
                    else: '$$REMOVE',
                  },
                },
              },
              else: '$$REMOVE',
            },
          },
          ios: {
            $cond: {
              if: { $ifNull: ['$devices.ios', false] },
              then: {
                min: {
                  $cond: {
                    if: { $ifNull: ['$devices.ios.min', false] },
                    then: {
                      $concat: [
                        { $toString: '$devices.ios.min.major' },
                        '.',
                        { $toString: '$devices.ios.min.minor' },
                        '.',
                        { $toString: '$devices.ios.min.patch' },
                      ],
                    },
                    else: '$$REMOVE',
                  },
                },
                max: {
                  $cond: {
                    if: { $ifNull: ['$devices.ios.max', false] },
                    then: {
                      $concat: [
                        { $toString: '$devices.ios.max.major' },
                        '.',
                        { $toString: '$devices.ios.max.minor' },
                        '.',
                        { $toString: '$devices.ios.max.patch' },
                      ],
                    },
                    else: '$$REMOVE',
                  },
                },
              },
              else: '$$REMOVE',
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        createdAt: 1,
        devices: {
          $cond: {
            if: {
              $or: [{ $ifNull: ['$devices.android', false] }, { $ifNull: ['$devices.ios', false] }],
            },
            then: '$devices',
            else: '$$REMOVE',
          },
        },
        isArchived: 1,
      },
    },
  ];
}
