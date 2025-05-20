import { PipelineStage } from 'mongoose';

export function getUserSegmentAggregationPipeline(): PipelineStage[] {
  return [
    {
      $unwind: {
        path: '$petTypes',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'pettypes',
        let: { petTypeId: '$petTypes' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$petTypeId', null] }],
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
            },
          },
        ],
        as: 'petTypes',
      },
    },
    {
      $unwind: {
        path: '$petTypes',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$_id',
        doc: {
          $first: '$$ROOT',
        },
        petTypes: {
          $push: '$petTypes',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$doc', { petTypes: '$petTypes' }],
        },
      },
    },
    {
      $unwind: {
        path: '$locations',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'countries',
        let: { countryId: '$locations.country' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$countryId', null] }],
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
            },
          },
        ],
        as: 'locations.country',
      },
    },
    {
      $unwind: {
        path: '$locations.country',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'cities',
        let: { cityId: '$locations.city' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$cityId', null] }],
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
            },
          },
        ],
        as: 'locations.city',
      },
    },
    {
      $unwind: {
        path: '$locations.city',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'areas',
        let: { areaId: '$locations.area' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$areaId', null] }],
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
            },
          },
        ],
        as: 'locations.area',
      },
    },
    {
      $unwind: {
        path: '$locations.area',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$_id',
        doc: {
          $first: '$$ROOT',
        },
        locations: {
          $push: '$locations',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$doc', { locations: '$locations' }],
        },
      },
    },
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
        description: 1,
        petStatuses: 1,
        petTypes: 1,
        devices: {
          $cond: {
            if: {
              $or: [{ $ifNull: ['$devices.android', false] }, { $ifNull: ['$devices.ios', false] }],
            },
            then: '$devices',
            else: '$$REMOVE',
          },
        },
        hasAttendedEvents: 1,
        hasHostedEvents: 1,
        locations: {
          $cond: {
            if: {
              $or: [
                { $ifNull: [{ $arrayElemAt: ['$locations.country', 0] }, false] },
                { $ifNull: [{ $arrayElemAt: ['$locations.city', 0] }, false] },
                { $ifNull: [{ $arrayElemAt: ['$locations.area', 0] }, false] },
              ],
            },
            then: '$locations',
            else: [],
          },
        },
        totalFollowers: 1,
        totalPets: 1,
        age: 1,
        createdAt: 1,
        isArchived: 1,
      },
    },
  ];
}
