import { getIsUserFollowed } from '@instapets-backend/common';
import { PipelineStage } from 'mongoose';

export function getLikersPipeline(userId: string): PipelineStage[] {
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
          ...getIsUserFollowed(userId),
          {
            $project: {
              isFollowed: 1,
              isPendingFollow: 1,
              isFollowingMe: 1,
              isUserPendingFollowOnMe: 1,
              username: 1,
              firstName: 1,
              lastName: 1,
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
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $replaceRoot: {
        newRoot: '$authorUser',
      },
    },
  ];
}
