import { getIsUserFollowed } from '@instapets-backend/common';
import { PipelineStage } from 'mongoose';

function getLocationData(): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'countries',
        let: { countryId: '$locationData.country' },
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
        as: 'locationData.country',
      },
    },
    {
      $unwind: {
        path: '$locationData.country',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'cities',
        let: { cityId: '$locationData.city' },
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
        as: 'locationData.city',
      },
    },
    {
      $unwind: {
        path: '$locationData.city',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        'locationData.location': {
          lat: {
            $arrayElemAt: ['$locationData.location.coordinates', 1],
          },
          lng: {
            $arrayElemAt: ['$locationData.location.coordinates', 0],
          },
        },
      },
    },
    {
      $unset: ['locationData.location.coordinates', 'locationData.location.type'],
    },
  ];
}

export function getFoundPostsPipeLine(): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'users',
        let: { userId: '$authorUser' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$userId', null] }],
              },
            },
          },
          {
            $project: {
              _id: 1,
              username: 1,
              profilePictureMedia: 1,
              firstName: 1,
              lastName: 1,
            },
          },
        ],
        as: 'authorUser',
      },
    },
    {
      $unwind: {
        path: '$authorUser',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'petbreeds',
        let: { breedId: '$foundPet.breed' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$breedId', null] }],
              },
            },
          },
          {
            $project: {
              name: 1,
            },
          },
        ],
        as: 'foundPet.breed',
      },
    },
    {
      $unwind: {
        path: '$foundPet.breed',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'pettypes',
        let: { typeId: '$foundPet.type' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$typeId', null] }],
              },
            },
          },
          {
            $project: {
              name: 1,
            },
          },
        ],
        as: 'foundPet.type',
      },
    },
    {
      $unwind: {
        path: '$foundPet.type',
        preserveNullAndEmptyArrays: true,
      },
    },
    ...getLocationData(),
    {
      $project: {
        _id: 1,
        foundPet: 1,
        authorUser: 1,
        createdAt: 1,
        description: 1,
        media: 1,
        dynamicLink: 1,
        locationData: 1,
        suspendedDueToUserSuspensionAt: 1,
        suspendedAt: 1,
      },
    },
  ];
}

export function getFoundPostAggregationPipeline(viewerId: string): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'users',
        let: { userId: '$authorUser' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$userId', null] }],
              },
            },
          },
          ...getIsUserFollowed(viewerId),
          {
            $project: {
              _id: 1,
              username: 1,
              profilePictureMedia: 1,
              firstName: 1,
              lastName: 1,
              isFollowed: 1,
              isPendingFollow: 1,
              isFollowingMe: 1,
              isUserPendingFollowOnMe: 1,
            },
          },
        ],
        as: 'authorUser',
      },
    },
    {
      $unwind: {
        path: '$authorUser',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'petbreeds',
        let: { breedId: '$foundPet.breed' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$breedId', null] }],
              },
            },
          },
          {
            $project: {
              name: 1,
            },
          },
        ],
        as: 'foundPet.breed',
      },
    },
    {
      $unwind: {
        path: '$foundPet.breed',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'pettypes',
        let: { typeId: '$foundPet.type' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$typeId', null] }],
              },
            },
          },
          {
            $project: {
              name: 1,
            },
          },
        ],
        as: 'foundPet.type',
      },
    },
    {
      $unwind: {
        path: '$foundPet.type',
        preserveNullAndEmptyArrays: true,
      },
    },
    ...getLocationData(),
    {
      $project: {
        _id: 1,
        foundPet: 1,
        authorUser: 1,
        locationData: 1,
        createdAt: 1,
        description: 1,
        media: 1,
        dynamicLink: 1,
        suspendedDueToUserSuspensionAt: 1,
        suspendedAt: 1,
      },
    },
  ];
}
