import { getIsUserFollowed } from '@instapets-backend/common';
import { PipelineStage } from 'mongoose';

export function getUsersPipeline(): PipelineStage[] {
  return [
    {
      $project: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        username: 1,
        profilePictureMedia: 1,
      },
    },
  ];
}

export function getFollowersPipeline(userId: string): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'users',
        let: { follower: '$follower' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$follower'],
              },
            },
          },
          ...getIsUserFollowed(userId),
          {
            $project: {
              firstName: 1,
              lastName: 1,
              profilePictureMedia: 1,
              username: 1,
              gender: 1,
              dynamicLink: 1,
              totalPosts: 1,
              totalPets: 1,
              totalFollowers: 1,
              totalUserFollowings: 1,
              totalPetFollowings: 1,
              isFollowed: 1,
              isPendingFollow: 1,
              isFollowingMe: 1,
              isUserPendingFollowOnMe: 1,
            },
          },
        ],
        as: 'follower',
      },
    },
    {
      $unwind: {
        path: '$follower',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $replaceRoot: {
        newRoot: '$follower',
      },
    },
  ];
}

export function getFollowingsPipeline(userId: string): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'users',
        let: { following: '$following' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$following'],
              },
            },
          },
          ...getIsUserFollowed(userId),
          {
            $project: {
              firstName: 1,
              lastName: 1,
              profilePictureMedia: 1,
              username: 1,
              gender: 1,
              dynamicLink: 1,
              totalPosts: 1,
              totalPets: 1,
              totalFollowers: 1,
              totalUserFollowings: 1,
              totalPetFollowings: 1,
              isFollowed: 1,
              isPendingFollow: 1,
              isFollowingMe: 1,
              isUserPendingFollowOnMe: 1,
            },
          },
        ],
        as: 'following',
      },
    },
    {
      $unwind: {
        path: '$following',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $replaceRoot: {
        newRoot: '$following',
      },
    },
  ];
}
