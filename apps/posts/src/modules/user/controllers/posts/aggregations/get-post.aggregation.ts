import { LikeType, getIsLiked, getIsPetFollowed, getIsUserFollowed } from '@instapets-backend/common';
import { PipelineStage } from 'mongoose';
import { getTaggedUsersAndPetsPipeline } from './get-tagged-users-pets.aggregation';
import { getTopicsPipeline } from './get-topics.aggregation';

export function getPostAggregationPipeline(viewerId: string): PipelineStage[] {
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
          ...getIsUserFollowed(viewerId),
          {
            $project: {
              firstName: 1,
              lastName: 1,
              username: 1,
              profilePictureMedia: 1,
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
                ...getIsUserFollowed(viewerId),
                {
                  $project: {
                    firstName: 1,
                    lastName: 1,
                    username: 1,
                    profilePictureMedia: 1,
                    isFollowed: 1,
                    isPendingFollow: 1,
                    isFollowingMe: 1,
                    isUserPendingFollowOnMe: 1,
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
          ...getIsPetFollowed(viewerId),
          {
            $project: {
              name: 1,
              user: 1,
              profilePictureMedia: 1,
              isFollowed: 1,
              isPendingFollow: 1,
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
    ...getIsLiked(viewerId, LikeType.POST),
    ...getTaggedUsersAndPetsPipeline(viewerId),
    ...getTopicsPipeline(),
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
        isPrivate: 1,
      },
    },
  ];
}
