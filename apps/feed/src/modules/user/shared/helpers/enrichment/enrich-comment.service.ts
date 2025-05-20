import { Inject, Injectable } from '@nestjs/common';
import {
  ICommentModel,
  IUserFollowModel,
  LikeType,
  ModelNames,
  getIsLiked,
  getIsUserFollowed,
} from '@instapets-backend/common';
import { Types } from 'mongoose';

@Injectable()
export class EnrichCommentService {
  constructor(@Inject(ModelNames.COMMENT) private commentModel: ICommentModel) {}

  async parseComment(commentId: string | undefined, viewerId: string): Promise<any> {
    const [comment] = await this.commentModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(commentId),
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
      ...getIsLiked(viewerId, LikeType.COMMENT),
      {
        $project: {
          _id: 1,
          authorUser: 1,
          body: 1,
          isLiked: 1,
          createdAt: 1,
          updatedAt: 1,
          totalLikes: 1,
          totalReplies: 1,
        },
      },
    ]);

    return comment;
  }
}
