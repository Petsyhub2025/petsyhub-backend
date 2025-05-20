import { Types } from 'mongoose';

/**
 * Adds isFollowed isPendingFollow isUserPendingFollowOnMe and isFollowingMe fields to aggregation
 * @param  userId
 * @returns Array
 */
export function getIsUserFollowed(userId: string) {
  return [
    {
      $lookup: {
        from: 'pendinguserfollows',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ['$following', { $ifNull: ['$$userId', null] }],
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
        as: 'userPendingFollowersArr',
      },
    },
    {
      $lookup: {
        from: 'pendinguserfollows',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ['$following', new Types.ObjectId(userId)],
                  },
                  {
                    $eq: ['$follower', { $ifNull: ['$$userId', null] }],
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
        as: 'viewedUserPendingFollowersArr',
      },
    },
    {
      $lookup: {
        from: 'userfollows',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ['$following', new Types.ObjectId(userId)],
                  },
                  {
                    $eq: ['$follower', { $ifNull: ['$$userId', null] }],
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
        as: 'userFollowingArr',
      },
    },
    {
      $lookup: {
        from: 'userfollows',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ['$following', { $ifNull: ['$$userId', null] }],
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
        as: 'userFollowersArr',
      },
    },
    {
      $addFields: {
        isFollowed: {
          $cond: {
            if: {
              $gt: [
                {
                  $size: '$userFollowersArr',
                },
                0,
              ],
            },
            then: true,
            else: false,
          },
        },
        isFollowingMe: {
          $cond: {
            if: {
              $gt: [
                {
                  $size: '$userFollowingArr',
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
                  $size: '$userPendingFollowersArr',
                },
                0,
              ],
            },
            then: true,
            else: false,
          },
        },
        isUserPendingFollowOnMe: {
          $cond: {
            if: {
              $gt: [
                {
                  $size: '$viewedUserPendingFollowersArr',
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
      $unset: ['userFollowersArr', 'userFollowingArr', 'userPendingFollowersArr', 'viewedUserPendingFollowersArr'],
    },
  ];
}
