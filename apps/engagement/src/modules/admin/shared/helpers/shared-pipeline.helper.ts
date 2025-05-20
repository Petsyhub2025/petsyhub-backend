import { PipelineStage } from 'mongoose';

export function getCommentUserPipeline() {
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
          {
            $project: {
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

export function getRepliesPipeline() {
  return [
    ...getCommentUserPipeline(),
    {
      $project: {
        _id: 1,
        authorUser: 1,
        body: 1,
        totalLikes: 1,
        createdAt: 1,
        suspendedDueToCommentSuspensionAt: 1,
        suspendedDueToUserSuspensionAt: 1,
        suspendedAt: 1,
      },
    },
  ];
}

export function getCommentPipeLine(replyLimit = 0): PipelineStage[] {
  return [
    ...getCommentUserPipeline(),
    ...((replyLimit > 0
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
                ...getRepliesPipeline(),
              ],
              as: 'replies',
            },
          },
        ]
      : []) as PipelineStage[]),
    {
      $project: {
        _id: 1,
        authorUser: 1,
        body: 1,
        totalLikes: 1,
        totalReplies: 1,
        replies: 1,
        createdAt: 1,
        suspendedDueToPostSuspensionAt: 1,
        suspendedDueToUserSuspensionAt: 1,
        suspendedAt: 1,
      },
    },
  ];
}
