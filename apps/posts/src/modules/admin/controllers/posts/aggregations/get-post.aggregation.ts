import { getTopicsPipeline } from '@posts/user/controllers/posts/aggregations/get-topics.aggregation';
import { PipelineStage } from 'mongoose';

export function getPostAggregationPipeline(): PipelineStage[] {
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
      $unwind: {
        path: '$taggedUsers',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'users',
        let: { userId: '$taggedUsers' },
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
        as: 'taggedUsers',
      },
    },
    {
      $unwind: {
        path: '$taggedUsers',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$_id',
        root: {
          $first: '$$ROOT',
        },
        taggedUsers: {
          $push: '$taggedUsers',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$root', { taggedUsers: '$taggedUsers' }],
        },
      },
    },
    {
      $unwind: {
        path: '$taggedPets',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'pets',
        let: { petId: '$taggedPets' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$petId', null] }],
              },
            },
          },
          {
            $project: {
              name: 1,
              profilePictureMedia: 1,
            },
          },
        ],
        as: 'taggedPets',
      },
    },
    {
      $unwind: {
        path: '$taggedPets',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$_id',
        root: {
          $first: '$$ROOT',
        },
        taggedPets: {
          $push: '$taggedPets',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$root', { taggedPets: '$taggedPets' }],
        },
      },
    },
    {
      $unwind: {
        path: '$allowedUsers',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'users',
        let: { userId: '$allowedUsers' },
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
        as: 'allowedUsers',
      },
    },
    {
      $unwind: {
        path: '$allowedUsers',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$_id',
        root: {
          $first: '$$ROOT',
        },
        allowedUsers: {
          $push: '$allowedUsers',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$root', { allowedUsers: '$allowedUsers' }],
        },
      },
    },
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
    {
      $unwind: {
        path: '$topics',
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
        isLiked: 1,
        totalLikes: 1,
        totalComments: 1,
        totalShares: 1,
        dynamicLink: 1,
        createdAt: 1,
        updatedAt: 1,
        taggedPets: 1,
        taggedUsers: 1,
        topics: 1,
        allowedUsers: 1,
        isPrivate: 1,
        suspendedDueToUserSuspensionAt: 1,
        suspendedAt: 1,
      },
    },
  ];
}
