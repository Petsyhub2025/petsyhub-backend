import { getIsPetFollowed, getIsUserFollowed } from '@instapets-backend/common';
import { PipelineStage, Types } from 'mongoose';

export function getLostPostAggregationPipeline(viewerId: string): PipelineStage[] {
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
              isPrivate: 1,
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
        from: 'pets',
        let: { petId: '$pet' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$petId', null] }],
              },
            },
          },
          {
            $lookup: {
              from: 'petbreeds',
              let: { breedId: '$breed' },
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
              as: 'breed',
            },
          },
          {
            $unwind: {
              path: '$breed',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'pettypes',
              let: { typeId: '$type' },
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
              as: 'type',
            },
          },
          {
            $unwind: {
              path: '$type',
              preserveNullAndEmptyArrays: true,
            },
          },
          ...getIsPetFollowed(viewerId),
          {
            $project: {
              _id: 1,
              name: 1,
              profilePictureMedia: 1,
              gender: 1,
              height: 1,
              weight: 1,
              birthDate: 1,
              type: 1,
              breed: 1,
              isLost: 1,
              isPendingFollow: 1,
              isFollowed: 1,
              isPetOwnedByMe: {
                $cond: {
                  if: {
                    $eq: ['$user.userId', new Types.ObjectId(viewerId)],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
        ],
        as: 'pet',
      },
    },
    {
      $unwind: {
        path: '$pet',
        preserveNullAndEmptyArrays: true,
      },
    },
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
    {
      $project: {
        _id: 1,
        pet: 1,
        authorUser: 1,
        locationData: 1,
        createdAt: 1,
        reward: 1,
        description: 1,
        media: 1,
        dynamicLink: 1,
      },
    },
  ];
}
