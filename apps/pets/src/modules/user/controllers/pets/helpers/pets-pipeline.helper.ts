import { getIsPetFollowed, getIsUserFollowed } from '@instapets-backend/common';
import { PipelineStage } from 'mongoose';
import { getPetAggregationPipeline } from '@pets/user/controllers/pets/aggregations/get-pet-pipeline.aggregation';

export function getPetsPipeline(userId: string): PipelineStage[] {
  return [
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
          ...getIsUserFollowed(userId),
          {
            $project: {
              firstName: 1,
              lastName: 1,
              username: 1,
              isFollowed: 1,
              isPendingFollow: 1,
              isFollowingMe: 1,
              isUserPendingFollowOnMe: 1,
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
      $lookup: {
        from: 'petbreeds',
        let: { breedId: '$breed' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$breedId'],
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
                $eq: ['$_id', '$$typeId'],
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
    ...getIsPetFollowed(userId),
    {
      $project: {
        bio: 1,
        name: 1,
        type: 1,
        breed: 1,
        user: 1,
        profilePictureMedia: 1,
        isPrivate: 1,
        isFollowed: 1,
        isPendingFollow: 1,
      },
    },
  ];
}

export function getPetFollowersPipeline(userId): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'users',
        let: { userId: '$follower' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$userId'],
              },
            },
          },
          ...getIsUserFollowed(userId),
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
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $replaceRoot: {
        newRoot: '$user',
      },
    },
  ];
}

export function getFollowedPetsPipeline(userId) {
  return [
    {
      $lookup: {
        from: 'pets',
        let: { petId: '$following' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$petId'],
              },
            },
          },
          ...(getPetAggregationPipeline(userId) as any),
        ],
        as: 'pet',
      },
    },
    {
      $unwind: {
        path: '$pet',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $replaceRoot: {
        newRoot: '$pet',
      },
    },
  ];
}
