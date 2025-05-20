import { PipelineStage } from 'mongoose';
import { UserFieldNameEnum, getUserPipeline } from './common-pipeline.helper';

export function getReportPipeLine(): PipelineStage[] {
  return [
    ...getUserPipeline(UserFieldNameEnum.USER, true),
    {
      $lookup: {
        from: 'posts',
        let: { postId: '$post' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$postId', null] }],
              },
            },
          },
          {
            $project: {
              _id: 1,
            },
          },
        ],
        as: 'post',
      },
    },
    {
      $unwind: {
        path: '$post',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'comments',
        let: { commentId: '$comment' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$commentId', null] }],
              },
            },
          },
          {
            $project: {
              _id: 1,
            },
          },
        ],
        as: 'comment',
      },
    },
    {
      $unwind: {
        path: '$comment',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'commentreplies',
        let: { commentReplyId: '$commentReply' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$commentReplyId', null] }],
              },
            },
          },
          {
            $project: {
              _id: 1,
            },
          },
        ],
        as: 'commentReply',
      },
    },
    {
      $unwind: {
        path: '$commentReply',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        authorUser: 1,
        reportType: 1,
        reason: 1,
        status: 1,
        user: 1,
        post: 1,
        comment: 1,
        commentReply: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ];
}
