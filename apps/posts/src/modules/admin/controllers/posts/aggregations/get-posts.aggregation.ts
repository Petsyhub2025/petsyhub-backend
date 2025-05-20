import { PipelineStage } from 'mongoose';

export function getPostsAggregationPipeline(): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'users',
        let: {
          authorUser: '$authorUser',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$authorUser', null] }],
              },
            },
          },
          {
            $project: {
              firstName: 1,
              lastName: 1,
              username: 1,
              profilePictureMedia: 1,
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
        let: {
          authorPet: '$authorPet',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$authorPet', null] }],
              },
            },
          },
          {
            $lookup: {
              from: 'users',
              let: { userId: '$user.userId' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$_id', '$$userId'],
                    },
                  },
                },
                {
                  $project: {
                    firstName: 1,
                    lastName: 1,
                    username: 1,
                    profilePictureMedia: 1,
                  },
                },
              ],
              as: 'user',
            },
          },
          {
            $unwind: {
              path: '$user',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              name: 1,
              user: 1,
              profilePictureMedia: 1,
            },
          },
        ],
        as: 'authorPet',
      },
    },
    {
      $unwind: {
        path: '$authorPet',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'countries',
        let: {
          country: '$checkInLocation.country',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$country', null] }],
              },
            },
          },
          {
            $project: {
              name: 1,
            },
          },
        ],
        as: 'checkInLocation.country',
      },
    },
    {
      $unwind: {
        path: '$checkInLocation.country',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'cities',
        let: {
          city: '$checkInLocation.city',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$city', null] }],
              },
            },
          },
          {
            $project: {
              name: 1,
            },
          },
        ],
        as: 'checkInLocation.city',
      },
    },
    {
      $unwind: {
        path: '$checkInLocation.city',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        authorUser: 1,
        authorPet: 1,
        body: 1,
        media: 1,
        checkInLocation: {
          $cond: {
            if: {
              $and: [{ $ifNull: ['$checkInLocation.country', false] }, { $ifNull: ['$checkInLocation.city', false] }],
            },
            then: '$checkInLocation',
            else: '$$REMOVE',
          },
        },
        totalLikes: 1,
        totalComments: 1,
        totalShares: 1,
        dynamicLink: 1,
        createdAt: 1,
        updatedAt: 1,
        totalTaggedPets: { $size: { $ifNull: ['$taggedPets', []] } },
        totalTaggedUsers: { $size: { $ifNull: ['$taggedUsers', []] } },
        totalAllowedUsers: { $size: { $ifNull: ['$allowedUsers', []] } },
        isPrivate: 1,
        suspendedDueToUserSuspensionAt: 1,
        suspendedAt: 1,
      },
    },
  ];
}
