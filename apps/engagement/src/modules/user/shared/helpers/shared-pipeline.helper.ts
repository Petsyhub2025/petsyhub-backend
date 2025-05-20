import { LikeType, getIsLiked, getIsUserFollowed } from '@instapets-backend/common';
import { PipelineStage } from 'mongoose';

export function getCommentUserPipeline(userId: string) {
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
        preserveNullAndEmptyArrays: true,
      },
    },
  ];
}

export function getRepliesPipeline(userId: string) {
  return [
    ...getCommentUserPipeline(userId),
    ...getIsLiked(userId, LikeType.COMMENT_REPLY),
    {
      $project: {
        _id: 1,
        authorUser: 1,
        body: 1,
        totalLikes: 1,
        isLiked: 1,
        createdAt: 1,
      },
    },
  ];
}

export function getCommentPipeLine(userId: string, replyLimit = 0): PipelineStage[] {
  return [
    ...getCommentUserPipeline(userId),
    ...getIsLiked(userId, LikeType.COMMENT),
    ...(replyLimit > 0
      ? [
          {
            $lookup: {
              from: 'commentreplies',
              let: { commentId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$replyOn', { $ifNull: ['$$commentId', null] }],
                    },
                  },
                },
                {
                  $sort: { _id: -1 },
                },
                {
                  $limit: replyLimit,
                },
                ...getRepliesPipeline(userId),
              ],
              as: 'replies',
            },
          },
        ]
      : []),
    {
      $project: {
        _id: 1,
        authorUser: 1,
        body: 1,
        totalLikes: 1,
        totalReplies: 1,
        replies: 1,
        isLiked: 1,
        createdAt: 1,
      },
    },
  ];
}
