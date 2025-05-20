import { Inject, Injectable } from '@nestjs/common';
import {
  ICommentReplyModel,
  IUserFollowModel,
  LikeType,
  ModelNames,
  getIsLiked,
  getIsUserFollowed,
} from '@instapets-backend/common';
import { Types } from 'mongoose';

@Injectable()
export class EnrichCommentReplyService {
  constructor(@Inject(ModelNames.COMMENT_REPLY) private commentReplyModel: ICommentReplyModel) {}

  async parseCommentReply(commentReplyId: string | undefined, viewerId: string): Promise<any> {
    const [commentReply] = await this.commentReplyModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(commentReplyId),
        },
      },
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
            ...getIsUserFollowed(viewerId),
            {
              $project: {
                _id: 1,
                username: 1,
                firstName: 1,
                lastName: 1,
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
          from: 'comments',
          let: { commentId: '$replyOn' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $ifNull: ['$$commentId', null] }],
                },
              },
            },
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
                  ...getIsUserFollowed(viewerId),
                  {
                    $project: {
                      _id: 1,
                      username: 1,
                      firstName: 1,
                      lastName: 1,
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
              $project: {
                _id: 1,
                authorUser: 1,
                body: 1,
                createdAt: 1,
                updatedAt: 1,
                totalLikes: 1,
                totalReplies: 1,
              },
            },
          ],
          as: 'replyOn',
        },
      },
      {
        $unwind: {
          path: '$replyOn',
          preserveNullAndEmptyArrays: true,
        },
      },
      ...getIsLiked(viewerId, LikeType.COMMENT_REPLY),
      {
        $project: {
          _id: 1,
          authorUser: 1,
          body: 1,
          replyOn: 1,
          isLiked: 1,
          createdAt: 1,
          updatedAt: 1,
          totalLikes: 1,
          totalReplies: 1,
        },
      },
    ]);

    return commentReply;
  }
}
