import { Types } from 'mongoose';

/**
 * Adds isFollowed and isPendingFollow fields to aggregation
 * @param  userId
 * @returns Array
 */
export function getIsPetFollowed(userId: string) {
  return [
    {
      $lookup: {
        from: 'pendingpetfollows',
        let: { petId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ['$following', '$$petId'],
                  },
                  {
                    $eq: ['$follower', new Types.ObjectId(userId)],
                  },
                ],
              },
            },
          },
          {
            $project: {
              _id: 1,
            },
          },
        ],
        as: 'petPendingFollowersArr',
      },
    },
    {
      $lookup: {
        from: 'petfollows',
        let: { petId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ['$following', '$$petId'],
                  },
                  {
                    $eq: ['$follower', new Types.ObjectId(userId)],
                  },
                ],
              },
            },
          },
          {
            $project: {
              _id: 1,
            },
          },
        ],
        as: 'petFollowersArr',
      },
    },
    {
      $addFields: {
        isFollowed: {
          $cond: {
            if: {
              $gt: [
                {
                  $size: '$petFollowersArr',
                },
                0,
              ],
            },
            then: true,
            else: false,
          },
        },
        isPendingFollow: {
          $cond: {
            if: {
              $gt: [
                {
                  $size: '$petPendingFollowersArr',
                },
                0,
              ],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $unset: ['petFollowersArr', 'petPendingFollowersArr'],
    },
  ];
}
