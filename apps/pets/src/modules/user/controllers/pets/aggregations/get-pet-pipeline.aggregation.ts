import { getIsPetFollowed, getIsUserFollowed } from '@instapets-backend/common';
import { PipelineStage } from 'mongoose';

export function getPetAggregationPipeline(viewerId: string, showPrivate = false): PipelineStage[] {
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
          ...getIsUserFollowed(viewerId),
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
    ...getIsPetFollowed(viewerId),
    {
      $project: {
        bio: 1,
        gender: 1,
        height: 1,
        name: 1,
        type: 1,
        breed: 1,
        weight: 1,
        user: 1,
        totalPosts: 1,
        totalFollowers: 1,
        profilePictureMedia: 1,
        isPrivate: 1,
        isLost: 1,
        isFollowed: 1,
        isPendingFollow: 1,
        dynamicLink: 1,
        status: 1,
        ...(showPrivate && { passportNumber: 1, birthDate: 1 }),
      },
    },
  ];
}
